import { useState, useCallback } from 'react';
import { getUploadUrl, uploadToS3, confirmUpload } from '../api/files.js';
import toast from 'react-hot-toast';

export const useUpload = (onSuccess) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = useCallback(async (file) => {
    setUploading(true);
    setProgress(0);
    try {
      const { data } = await getUploadUrl(file.name, file.type, file.size);
      const { fileId, uploadUrl } = data.data;
      setProgress(10);
      await uploadToS3(uploadUrl, file, (p) => setProgress(10 + p * 0.7));
      setProgress(85);
      await confirmUpload(fileId);
      setProgress(100);
      toast.success(`${file.name} uploaded!`);
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1500);
    }
  }, [onSuccess]);

  return { upload, uploading, progress };
};
