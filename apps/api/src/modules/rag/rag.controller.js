import { ragQuery, summarizeDocument, generateQA, multiDocQuery } from './rag.service.js';
import { logger } from '../../utils/logger.js';

export const ragController = async (req, res) => {
  const { question, documentIds, limit } = req.body;
  if (!question?.trim()) return res.status(400).json({ success: false, message: 'Question is required' });
  const result = await ragQuery(req.user.orgId, question, { documentIds, limit });
  res.json({ success: true, data: result });
};

export const multiDocController = async (req, res) => {
  const { question, documentIds = [], limit } = req.body;
  if (!question?.trim()) return res.status(400).json({ success: false, message: 'Question is required' });
  const result = await multiDocQuery(req.user.orgId, question, documentIds, { limit });
  res.json({ success: true, data: result });
};

export const summarizeController = async (req, res) => {
  const { documentId } = req.params;
  logger.info('Summarize request', { documentId, orgId: req.user.orgId });
  const result = await summarizeDocument(req.user.orgId, documentId);
  res.json({ success: true, data: result });
};

export const generateQAController = async (req, res) => {
  const { documentId } = req.params;
  const { count = 5 } = req.body;
  logger.info('Generate Q&A request', { documentId, count });
  const result = await generateQA(req.user.orgId, documentId, count);
  res.json({ success: true, data: result });
};
