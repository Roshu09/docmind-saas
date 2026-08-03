import { query } from '../../config/database.js';
import { logger } from '../../utils/logger.js';

// Create a new chat session
export const createSession = async (orgId, userId, firstQuestion, type = 'chat', documentIds = []) => {
  const title = firstQuestion.length > 60 
    ? firstQuestion.substring(0, 60) + '...' 
    : firstQuestion;
  
  const result = await query(
    `INSERT INTO chat_sessions (org_id, user_id, title, type, document_ids)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, title, type, created_at`,
    [orgId, userId, title, type, documentIds]
  );
  return result.rows[0];
};

// Save a message to a session
export const saveMessage = async (sessionId, role, content, sources = [], chunksUsed = 0) => {
  await query(
    `INSERT INTO chat_messages (session_id, role, content, sources, chunks_used)
     VALUES ($1, $2, $3, $4, $5)`,
    [sessionId, role, content, JSON.stringify(sources), chunksUsed]
  );
  // Update session updated_at
  await query(
    'UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1',
    [sessionId]
  );
};

// Get all sessions for a user
export const getSessions = async (orgId, userId, type = 'chat') => {
  const result = await query(
    `SELECT id, title, type, document_ids, created_at, updated_at
     FROM chat_sessions
     WHERE org_id = $1 AND user_id = $2 AND type = $3
     ORDER BY updated_at DESC
     LIMIT 30`,
    [orgId, userId, type]
  );
  return result.rows;
};

// Get messages for a session
export const getSessionMessages = async (sessionId, orgId, userId) => {
  // Verify session belongs to user
  const sessionCheck = await query(
    'SELECT id FROM chat_sessions WHERE id = $1 AND org_id = $2 AND user_id = $3',
    [sessionId, orgId, userId]
  );
  if (sessionCheck.rowCount === 0) throw new Error('Session not found');

  const result = await query(
    `SELECT id, role, content, sources, chunks_used, created_at
     FROM chat_messages
     WHERE session_id = $1
     ORDER BY created_at ASC`,
    [sessionId]
  );
  return result.rows;
};

// Delete a session
export const deleteSession = async (sessionId, orgId, userId) => {
  await query(
    'DELETE FROM chat_sessions WHERE id = $1 AND org_id = $2 AND user_id = $3',
    [sessionId, orgId, userId]
  );
};
