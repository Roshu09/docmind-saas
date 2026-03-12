import { createApiKey, listApiKeys, revokeApiKey, deleteApiKey } from './apikeys.service.js';

export const createApiKeyController = async (req, res) => {
  const { orgId, id: userId } = req.user;
  const { name, scopes, expiresAt } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Key name is required' });
  const defaultScopes = scopes || ['search', 'summarize', 'qa', 'chat', 'compare'];
  const result = await createApiKey(orgId, userId, name, defaultScopes, expiresAt);
  res.status(201).json({
    success: true,
    message: 'API key created. Copy it now — it will not be shown again!',
    data: result
  });
};

export const listApiKeysController = async (req, res) => {
  const { orgId } = req.user;
  const keys = await listApiKeys(orgId);
  res.json({ success: true, data: keys });
};

export const revokeApiKeyController = async (req, res) => {
  const { orgId } = req.user;
  const { id } = req.params;
  const ok = await revokeApiKey(id, orgId);
  if (!ok) return res.status(404).json({ success: false, message: 'Key not found' });
  res.json({ success: true, message: 'API key revoked' });
};

export const deleteApiKeyController = async (req, res) => {
  const { orgId } = req.user;
  const { id } = req.params;
  const ok = await deleteApiKey(id, orgId);
  if (!ok) return res.status(404).json({ success: false, message: 'Key not found' });
  res.json({ success: true, message: 'API key deleted' });
};
