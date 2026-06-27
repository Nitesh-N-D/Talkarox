import { createClient } from '@supabase/supabase-js';

let supabase = null;

function getClient() {
  if (supabase) return supabase;
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return null;
  }
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  return supabase;
}

const BUCKETS = {
  AVATARS: 'avatars',
  ATTACHMENTS: 'attachments',
  WHITEBOARDS: 'whiteboards',
};

/**
 * Uploads a buffer to Supabase Storage and returns its public URL.
 * Requires SUPABASE_URL + SUPABASE_SERVICE_KEY (service role key, not the
 * anon key — this runs server-side and needs write access to storage).
 * Throws a clear error if Supabase Storage isn't configured, so callers
 * can surface a helpful message instead of silently failing.
 */
export async function uploadFile({ bucket, path, buffer, contentType }) {
  const client = getClient();
  if (!client) {
    throw new Error(
      'File storage is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_KEY to backend/.env — see SETUP_GUIDE.md.'
    );
  }

  const { error } = await client.storage.from(bucket).upload(path, buffer, {
    contentType,
    upsert: true,
  });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data } = client.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteFile({ bucket, path }) {
  const client = getClient();
  if (!client) return;
  await client.storage.from(bucket).remove([path]);
}

export function isStorageConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
}

export { BUCKETS };
