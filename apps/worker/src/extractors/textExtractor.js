// src/extractors/textExtractor.js
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { logger } from '../utils/logger.js';

// Create S3 client lazily inside the function (after dotenv loads)
const getS3Client = () => new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const downloadFromS3 = async (bucket, key) => {
  const s3 = getS3Client();
  const response = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const chunks = [];
  for await (const chunk of response.Body) chunks.push(chunk);
  return Buffer.concat(chunks);
};

const extractPdf = async (buffer) => {
  const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
  const data = await pdfParse(buffer);
  return { text: data.text, pageCount: data.numpages, wordCount: data.text.split(/\s+/).filter(Boolean).length };
};

const extractDocx = async (buffer) => {
  const mammoth = (await import('mammoth')).default;
  const result = await mammoth.extractRawText({ buffer });
  return { text: result.value, pageCount: null, wordCount: result.value.split(/\s+/).filter(Boolean).length };
};

const extractTxt = (buffer) => {
  const text = buffer.toString('utf-8');
  return { text, pageCount: 1, wordCount: text.split(/\s+/).filter(Boolean).length };
};

export const extractText = async (s3Bucket, s3Key, mimeType) => {
  logger.info('Downloading from S3', { s3Key });
  const buffer = await downloadFromS3(s3Bucket, s3Key);
  logger.info('Downloaded', { sizeKB: (buffer.length / 1024).toFixed(1) });

  let result;
  if (mimeType === 'application/pdf') result = await extractPdf(buffer);
  else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') result = await extractDocx(buffer);
  else if (mimeType === 'text/plain') result = extractTxt(buffer);
  else throw new Error(`Unsupported MIME type: ${mimeType}`);

  result.text = result.text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim();
  logger.info('Extraction complete', { pageCount: result.pageCount, wordCount: result.wordCount });
  return result;
};