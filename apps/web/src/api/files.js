import client from './client'
export const filesApi = {
  list: (params) => client.get('/api/files', { params }),
  get: (id) => client.get(`/api/files/${id}`),
  getUploadUrl: (data) => client.post('/api/files/upload-url', data),
  confirm: (id) => client.post(`/api/files/${id}/confirm`),
  delete: (id) => client.delete(`/api/files/${id}`),
  downloadUrl: (id) => client.get(`/api/files/${id}/download-url`),
  uploadToS3: (uploadUrl, file, onProgress) => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded/e.total)*100)) }
    xhr.onload = () => xhr.status === 200 ? resolve() : reject(new Error('S3 upload failed: ' + xhr.status))
    xhr.onerror = () => reject(new Error('Network error'))
    xhr.open('PUT', uploadUrl)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  }),
}
