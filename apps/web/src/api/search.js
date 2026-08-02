import client from './client'

export const searchApi = {
  search: (query, options = {}) => client.post('/api/search', { query, ...options }),
  ragQuery: (question, options = {}) => client.post('/api/rag/query', { question, ...options }),
  summarize: (documentId) => client.post(`/api/rag/summarize/${documentId}`),
  generateQA: (documentId, count = 5) => client.post(`/api/rag/generate-qa/${documentId}`, { count }),
  multiDocQuery: (question, documentIds = []) => client.post('/api/rag/multi-query', { question, documentIds }),
  compareDocuments: (docIdA, docIdB) => client.post('/api/rag/compare', { docIdA, docIdB }),
}

const getToken = () => {
  try {
    const raw = localStorage.getItem('aifi-auth');
    return raw ? JSON.parse(raw)?.state?.accessToken : null;
  } catch { return null; }
};

export const streamRagQuery = async (question, options = {}, onChunk) => {
  const token = getToken();
  const response = await fetch('/api/rag/query/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ question, ...options }),
  });
  if (!response.ok) throw new Error('Stream request failed');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (!data) continue;
      try { onChunk(JSON.parse(data)); } catch {}
    }
  }
};

export const streamMultiDocQuery = async (question, documentIds = [], onChunk) => {
  const token = getToken();
  const response = await fetch('/api/rag/multi-query/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ question, documentIds }),
  });
  if (!response.ok) throw new Error('Stream request failed');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (!data) continue;
      try { onChunk(JSON.parse(data)); } catch {}
    }
  }
};

export const ragApi = searchApi
