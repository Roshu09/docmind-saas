import { ragQuery, summarizeDocument, generateQA, multiDocQuery } from './rag.service.js';
import { logger } from '../../utils/logger.js';

const handleError = (res, err) => {
  const isRate = err.isRateLimit || err.message?.includes('rate limit') || err.message?.includes('Rate limit');
  return res.status(500).json({
    success: false,
    message: isRate ? '⏳ Daily AI limit reached. Please wait for reset.' : err.message,
    isRateLimit: !!isRate,
    resetMs: err.resetMs || 0,
    resetAt: err.resetMs ? new Date(Date.now() + err.resetMs).toISOString() : null,
  });
};

export const ragController = async (req, res) => {
  const { question, documentIds, limit } = req.body;
  if (!question?.trim()) return res.status(400).json({ success: false, message: 'Question is required' });
  try {
    const result = await ragQuery(req.user.orgId, question, { documentIds, limit });
    res.json({ success: true, data: result });
  } catch (err) { handleError(res, err); }
};

export const multiDocController = async (req, res) => {
  const { question, documentIds = [], limit } = req.body;
  if (!question?.trim()) return res.status(400).json({ success: false, message: 'Question is required' });
  try {
    const result = await multiDocQuery(req.user.orgId, question, documentIds, { limit });
    res.json({ success: true, data: result });
  } catch (err) { handleError(res, err); }
};

export const summarizeController = async (req, res) => {
  const { documentId } = req.params;
  logger.info('Summarize request', { documentId, orgId: req.user.orgId });
  try {
    const result = await summarizeDocument(req.user.orgId, documentId);
    res.json({ success: true, data: result });
  } catch (err) { handleError(res, err); }
};

export const generateQAController = async (req, res) => {
  const { documentId } = req.params;
  const { count = 5 } = req.body;
  logger.info('Generate Q&A request', { documentId, count });
  try {
    const result = await generateQA(req.user.orgId, documentId, count);
    res.json({ success: true, data: result });
  } catch (err) { handleError(res, err); }
};