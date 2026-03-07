import client from './client'

export const searchApi = {
  search: (query, options = {}) => client.post('/api/search', { query, ...options }),
  ragQuery: (question, options = {}) => client.post('/api/rag/query', { question, ...options }),
  summarize: (documentId) => client.post(`/api/rag/summarize/${documentId}`),
  generateQA: (documentId, count = 5) => client.post(`/api/rag/generate-qa/${documentId}`, { count }),
}

export const ragApi = searchApi