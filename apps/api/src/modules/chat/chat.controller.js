import { createSession, saveMessage, getSessions, getSessionMessages, deleteSession } from './chat.service.js';

export const getSessionsController = async (req, res) => {
  const type = req.query.type || 'chat';
  const sessions = await getSessions(req.user.orgId, req.user.id, type);
  res.json({ success: true, data: sessions });
};

export const getMessagesController = async (req, res) => {
  const { sessionId } = req.params;
  const messages = await getSessionMessages(sessionId, req.user.orgId, req.user.id);
  res.json({ success: true, data: messages });
};

export const createSessionController = async (req, res) => {
  const { firstQuestion, type = 'chat', documentIds = [] } = req.body;
  if (!firstQuestion?.trim()) return res.status(400).json({ success: false, message: 'First question required' });
  const session = await createSession(req.user.orgId, req.user.id, firstQuestion, type, documentIds);
  res.json({ success: true, data: session });
};

export const saveMessageController = async (req, res) => {
  const { sessionId } = req.params;
  const { role, content, sources = [], chunksUsed = 0 } = req.body;
  if (!role || !content) return res.status(400).json({ success: false, message: 'Role and content required' });
  await saveMessage(sessionId, role, content, sources, chunksUsed);
  res.json({ success: true });
};

export const deleteSessionController = async (req, res) => {
  const { sessionId } = req.params;
  await deleteSession(sessionId, req.user.orgId, req.user.id);
  res.json({ success: true });
};
