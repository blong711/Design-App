import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const s3Upload = async (file: File, presignedUrl: string) => {
  return await axios.put(presignedUrl, file, {
    headers: {
      'Content-Type': file.type,
    },
  });
};

// Helper for multipart (chunked) upload for heavy files
export const heavyUpload = async (
  file: File,
  onProgress?: (progress: number) => void
) => {
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
  const fileSize = file.size;

  // Use simple upload for small files (< 10MB)
  if (fileSize < 2 * CHUNK_SIZE) {
    const res = await api.get(`/s3/presigned-url?filename=${encodeURIComponent(file.name)}&content_type=${encodeURIComponent(file.type)}`);
    const { upload_url, public_url } = res.data;

    // Fallback local upload support
    if (upload_url.includes('/local-upload')) {
      await api.put(upload_url, file, { headers: { 'Content-Type': file.type } });
      return public_url;
    }

    await s3Upload(file, upload_url);
    if (onProgress) onProgress(100);
    return public_url;
  }

  // 1. Start multipart upload
  const startRes = await api.post('/s3/multipart/start', {
    filename: file.name,
    content_type: file.type,
  });
  const { upload_id, object_key } = startRes.data;

  // 2. Request presigned URLs for each chunk
  const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
  const urlsRes = await api.post(`/s3/multipart/${upload_id}/urls`, {
    object_key,
    parts: totalChunks,
  });
  const presignedUrls: { part_number: number, url: string }[] = urlsRes.data.urls;

  // 3. Upload chunks concurrently (e.g., 3 at a time to prevent network overload)
  let completedChunks = 0;
  const parts: { ETag: string, PartNumber: number }[] = [];

  const uploadChunk = async (chunkIndex: number) => {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, fileSize);
    const chunk = file.slice(start, end);
    const urlData = presignedUrls.find(u => u.part_number === chunkIndex + 1)!;

    const res = await axios.put(urlData.url, chunk, {
      headers: {
        'Content-Type': file.type,
      },
    });

    // AWS returns ETag wrapped in quotes, we need to extract it
    const eTag = res.headers['etag']?.replace(/"/g, '');
    parts.push({ ETag: eTag, PartNumber: urlData.part_number });

    completedChunks++;
    if (onProgress) {
      onProgress(Math.round((completedChunks / totalChunks) * 100));
    }
  };

  const MAX_CONCURRENT_UPLOADS = 3;
  for (let i = 0; i < totalChunks; i += MAX_CONCURRENT_UPLOADS) {
    const chunkPromises = [];
    for (let j = 0; j < MAX_CONCURRENT_UPLOADS && (i + j) < totalChunks; j++) {
      chunkPromises.push(uploadChunk(i + j));
    }
    await Promise.all(chunkPromises);
  }

  // 4. Complete multipart upload
  parts.sort((a, b) => a.PartNumber - b.PartNumber); // S3 requires parts to be in order
  const completeRes = await api.post(`/s3/multipart/${upload_id}/complete`, {
    object_key,
    parts,
  });

  return completeRes.data.public_url;
};
