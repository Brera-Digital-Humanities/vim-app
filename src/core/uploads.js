// VIM — direct external-file uploads to the backend-managed S3 bucket.

const EXTERNAL_FILE_FIELD_RE = /^xfile_[A-Za-z0-9_]+$/;

function uploadPercent(loadedBytes, totalBytes) {
  if (!totalBytes) return 100;
  return Math.max(0, Math.min(100, Math.round((loadedBytes / totalBytes) * 100)));
}

function isExternalFileName(name) {
  return EXTERNAL_FILE_FIELD_RE.test(String(name || ''));
}

function isExternalFileField(field) {
  return !!field && (field.type === 'xfile' || isExternalFileName(field.name));
}

function nativeMediaFiles(files) {
  const out = {};
  Object.entries(files || {}).forEach(([name, file]) => {
    if (!isExternalFileName(name)) out[name] = file;
  });
  return out;
}

function hasPendingExternalMedia(files) {
  return Object.entries(files || {}).some(([name, file]) => isExternalFileName(name) && file);
}

function hasExternalFileAnswers(ans) {
  return Object.keys(ans || {}).some(isExternalFileName);
}

function isUploadedExternalFileValue(value) {
  if (typeof value !== 'string' || value.trim()[0] !== '{') return false;
  try {
    const data = JSON.parse(value);
    return !!(data && data.status === 'uploaded' && data.file_id && data.key);
  } catch (error) {
    return false;
  }
}

function externalKindForField(name, file) {
  const lower = String(name || '').toLowerCase();
  const mime = String((file && file.type) || '').toLowerCase();

  if (lower.includes('audio') || lower.includes('recording') || mime.startsWith('audio/')) return 'audio';
  if (lower.includes('foto') || lower.includes('image') || mime.startsWith('image/')) return 'image';
  if (lower.includes('video') || mime.startsWith('video/')) return 'video';

  return 'file';
}

async function prepareExternalFilesForSubmit(item, options = {}) {
  if (!item || !item.mediaFiles) return false;

  const onProgress = typeof options.onProgress === 'function' ? options.onProgress : () => {};
  const entries = [];
  let changed = false;
  for (const [fieldName, file] of Object.entries(Object.assign({}, item.mediaFiles))) {
    if (!isExternalFileName(fieldName)) continue;

    if (isUploadedExternalFileValue(item.answers && item.answers[fieldName])) {
      delete item.mediaFiles[fieldName];
      changed = true;
      continue;
    }

    if (!file) continue;
    entries.push([fieldName, file]);
  }

  const totalBytes = entries.reduce((sum, [, file]) => sum + Math.max(0, Number(file.size || 0)), 0);
  let uploadedBytes = 0;

  if (entries.length) {
    onProgress({
      phase: 'external-start',
      loadedBytes: 0,
      totalBytes,
      doneFiles: 0,
      totalFiles: entries.length,
      percent: totalBytes ? 0 : null,
    });
  }

  for (let index = 0; index < entries.length; index++) {
    const [fieldName, file] = entries[index];
    const fileSize = Math.max(0, Number(file.size || 0));
    const filename = file.name || `${fieldName}.bin`;

    onProgress({
      phase: 'external-file',
      fileName: filename,
      fileIndex: index + 1,
      totalFiles: entries.length,
      doneFiles: index,
      loadedBytes: uploadedBytes,
      totalBytes,
      percent: totalBytes ? uploadPercent(uploadedBytes, totalBytes) : null,
    });

    const metadata = await uploadExternalFile(fieldName, file, item.id, {
      onProgress: progress => {
        const fileLoaded = Math.max(0, Math.min(fileSize, Number(progress.loadedBytes || 0)));
        const loadedBytes = uploadedBytes + fileLoaded;
        onProgress({
          phase: 'external-file',
          fileName: filename,
          fileIndex: index + 1,
          totalFiles: entries.length,
          doneFiles: index,
          loadedBytes,
          totalBytes,
          percent: totalBytes ? uploadPercent(loadedBytes, totalBytes) : null,
        });
      },
    });
    item.answers[fieldName] = JSON.stringify(metadata);
    delete item.mediaFiles[fieldName];
    changed = true;
    uploadedBytes += fileSize;
    onProgress({
      phase: 'external-file',
      fileName: filename,
      fileIndex: index + 1,
      totalFiles: entries.length,
      doneFiles: index + 1,
      loadedBytes: uploadedBytes,
      totalBytes,
      percent: totalBytes ? uploadPercent(uploadedBytes, totalBytes) : 100,
    });
    saveOutboxRecord(item);
  }

  if (entries.length) {
    onProgress({
      phase: 'external-complete',
      loadedBytes: totalBytes,
      totalBytes,
      doneFiles: entries.length,
      totalFiles: entries.length,
      percent: 100,
    });
  }

  return changed;
}

async function uploadExternalFile(fieldName, file, submissionUuid, options = {}) {
  const onProgress = typeof options.onProgress === 'function' ? options.onProgress : () => {};
  const init = await koboUploadJson('uploads/init', {
    field_name: fieldName,
    submission_uuid: submissionUuid,
    filename: file.name || `${fieldName}.bin`,
    mime_type: file.type || 'application/octet-stream',
    size_bytes: file.size || 0,
    kind: externalKindForField(fieldName, file),
  });

  if (init.method === 'multipart') {
    return init.transport === 'direct'
      ? uploadExternalMultipartDirect(file, init, { onProgress })
      : uploadExternalMultipartProxy(file, init, { onProgress });
  }

  if (init.transport !== 'direct') {
    return uploadExternalSingleProxy(file, init, { onProgress });
  }

  return uploadExternalSingleDirect(file, init, { onProgress });
}

async function uploadExternalSingleDirect(file, init, options = {}) {
  const uploadResponse = await xhrUpload(init.upload_url, {
    method: 'PUT',
    headers: init.headers || {},
    body: file,
    onProgress: options.onProgress,
  });

  if (!uploadResponse.ok) {
    throw new Error(`${tr().externalUploadFailed} HTTP ${uploadResponse.status}`);
  }

  const completed = await koboUploadJson('uploads/complete', {
    file: init.file,
  });

  return completed.file;
}

async function uploadExternalSingleProxy(file, init, options = {}) {
  const completed = await koboUploadForm('uploads/proxy-single', {
    file: init.file,
  }, file, file.name || `${init.file.field || 'file'}.bin`, {
    onProgress: options.onProgress,
  });

  return completed.file;
}

async function uploadExternalMultipartDirect(file, init, options = {}) {
  const onProgress = typeof options.onProgress === 'function' ? options.onProgress : () => {};
  const partSize = Math.max(5 * 1024 * 1024, Number(init.part_size || 0));
  const totalParts = Math.ceil((file.size || 0) / partSize);
  const parts = [];

  try {
    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      const start = (partNumber - 1) * partSize;
      const end = Math.min(file.size, start + partSize);
      const chunk = file.slice(start, end);
      const signed = await koboUploadJson('uploads/part-url', {
        key: init.file.key,
        upload_id: init.upload_id,
        part_number: partNumber,
      });

      const response = await xhrUpload(signed.upload_url, {
        method: 'PUT',
        body: chunk,
        onProgress: progress => {
          onProgress({
            loadedBytes: start + Math.max(0, Number(progress.loadedBytes || 0)),
            totalBytes: file.size || 0,
            partNumber,
            totalParts,
          });
        },
      });

      if (!response.ok) {
        throw new Error(`${tr().externalUploadFailed} HTTP ${response.status}`);
      }

      onProgress({
        loadedBytes: end,
        totalBytes: file.size || 0,
        partNumber,
        totalParts,
      });

      const etag = response.getHeader('ETag') || response.getHeader('etag');
      if (!etag) {
        throw new Error(tr().externalUploadEtagMissing);
      }

      parts.push({ part_number: partNumber, etag });
    }

    const completed = await koboUploadJson('uploads/complete', {
      file: init.file,
      key: init.file.key,
      upload_id: init.upload_id,
      parts,
    });

    return completed.file;
  } catch (error) {
    await koboUploadJson('uploads/abort', {
      key: init.file.key,
      upload_id: init.upload_id,
    }).catch(() => {});
    throw error;
  }
}

async function uploadExternalMultipartProxy(file, init, options = {}) {
  const onProgress = typeof options.onProgress === 'function' ? options.onProgress : () => {};
  const partSize = Math.max(5 * 1024 * 1024, Number(init.part_size || 0));
  const totalParts = Math.ceil((file.size || 0) / partSize);
  const parts = [];

  try {
    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      const start = (partNumber - 1) * partSize;
      const end = Math.min(file.size, start + partSize);
      const chunk = file.slice(start, end);
      const part = await koboUploadForm('uploads/proxy-part', {
        key: init.file.key,
        upload_id: init.upload_id,
        part_number: partNumber,
      }, chunk, `${file.name || init.file.name || 'file'}.part${partNumber}`, {
        onProgress: progress => {
          onProgress({
            loadedBytes: start + Math.max(0, Number(progress.loadedBytes || 0)),
            totalBytes: file.size || 0,
            partNumber,
            totalParts,
          });
        },
      });

      onProgress({
        loadedBytes: end,
        totalBytes: file.size || 0,
        partNumber,
        totalParts,
      });

      parts.push({
        part_number: part.part_number,
        etag: part.etag,
      });
    }

    const completed = await koboUploadJson('uploads/complete', {
      file: init.file,
      key: init.file.key,
      upload_id: init.upload_id,
      parts,
    });

    return completed.file;
  } catch (error) {
    await koboUploadJson('uploads/abort', {
      key: init.file.key,
      upload_id: init.upload_id,
    }).catch(() => {});
    throw error;
  }
}

async function koboUploadJson(path, payload) {
  const response = await fetch(`${AUTH_API_URL}/kobo/${path}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `${apiTokenType || 'bearer'} ${apiAccessToken}`,
    },
    body: JSON.stringify(payload || {}),
  });

  const raw = await response.text().catch(() => '');
  let data = {};
  if (raw) {
    try { data = JSON.parse(raw); }
    catch (error) { data = { error: raw }; }
  }

  if (!response.ok) {
    throw new Error(data.error || `${tr().externalUploadFailed} HTTP ${response.status}`);
  }

  return data;
}

async function koboUploadForm(path, payload, blob, filename, options = {}) {
  const form = new FormData();
  form.append('payload', JSON.stringify(payload || {}));
  form.append('blob', blob, filename || 'blob.bin');

  const response = await xhrUpload(`${AUTH_API_URL}/kobo/${path}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Authorization': `${apiTokenType || 'bearer'} ${apiAccessToken}`,
    },
    body: form,
    onProgress: options.onProgress,
  });

  const raw = response.bodyText || '';
  let data = {};
  if (raw) {
    try { data = JSON.parse(raw); }
    catch (error) { data = { error: raw }; }
  }

  if (!response.ok) {
    throw new Error(data.error || `${tr().externalUploadFailed} HTTP ${response.status}`);
  }

  return data;
}

function xhrUpload(url, options = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const method = options.method || 'POST';
    const headers = options.headers || {};
    const onProgress = typeof options.onProgress === 'function' ? options.onProgress : null;

    xhr.open(method, url, true);
    Object.entries(headers).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value) !== '') {
        xhr.setRequestHeader(key, value);
      }
    });

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = event => {
        onProgress({
          loadedBytes: event.loaded || 0,
          totalBytes: event.lengthComputable ? event.total : 0,
        });
      };
    }

    xhr.onload = () => resolve({
      ok: xhr.status >= 200 && xhr.status < 300,
      status: xhr.status,
      statusText: xhr.statusText,
      bodyText: xhr.responseText || '',
      getHeader: name => xhr.getResponseHeader(name),
    });
    xhr.onerror = () => reject(new Error(tr().networkError || 'Network error'));
    xhr.onabort = () => reject(new Error(tr().networkError || 'Network error'));
    xhr.send(options.body || null);
  });
}
