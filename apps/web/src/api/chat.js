import client from './client'

export const chatApi = {
  // Sessions
  getSessions: (type = 'chat') => client.get(`/api/chat/sessions?type=${type}`),
  createSession: (firstQuestion, type = 'chat', documentIds = []) => 
    client.post('/api/chat/sessions', { firstQuestion, type, documentIds }),
  deleteSession: (sessionId) => client.delete(`/api/chat/sessions/${sessionId}`),
  
  // Messages
  getMessages: (sessionId) => client.get(`/api/chat/sessions/${sessionId}/messages`),
  saveMessage: (sessionId, role, content, sources = [], chunksUsed = 0) =>
    client.post(`/api/chat/sessions/${sessionId}/messages`, { role, content, sources, chunksUsed }),
}
