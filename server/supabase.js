import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '';
const DEFAULT_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'bookhaven';

let supabaseClient = null;

if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    console.log('✅ Supabase Client initialized successfully.');
  } catch (err) {
    console.error('⚠️ Failed to initialize Supabase client:', err.message);
  }
} else {
  console.log('ℹ️ Supabase environment variables not set. Running in local fallback mode.');
}

export function isSupabaseConfigured() {
  return Boolean(supabaseClient && SUPABASE_URL && SUPABASE_KEY);
}

export function getSupabase() {
  return supabaseClient;
}

/**
 * Upload a binary buffer to Supabase Storage
 * Returns the permanent public URL
 */
export async function uploadToSupabaseStorage({
  buffer,
  filename,
  mimeType,
  bucketName = DEFAULT_BUCKET
}) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  // Ensure unique path in bucket
  const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `uploads/${Date.now()}-${cleanFilename}`;

  // Try uploading directly
  const { data, error } = await supabaseClient.storage
    .from(bucketName)
    .upload(filePath, buffer, {
      contentType: mimeType || 'image/jpeg',
      upsert: true
    });

  if (error) {
    // If bucket does not exist, try creating bucket if using service role key
    if (error.message && error.message.toLowerCase().includes('bucket not found')) {
      console.log(`Bucket "${bucketName}" not found, attempting to create...`);
      const { error: createError } = await supabaseClient.storage.createBucket(bucketName, {
        public: true
      });
      if (!createError) {
        const retry = await supabaseClient.storage
          .from(bucketName)
          .upload(filePath, buffer, {
            contentType: mimeType || 'image/jpeg',
            upsert: true
          });
        if (retry.error) throw retry.error;
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }

  // Retrieve public URL
  const { data: publicData } = supabaseClient.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return {
    publicUrl: publicData.publicUrl,
    filePath,
    bucket: bucketName
  };
}

/**
 * Supabase Auth helper for User Identity
 */
export async function signUpSupabaseUser({ email, password, name, college, phone }) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        college: college || 'Campus',
        phone: phone || ''
      }
    }
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Supabase Auth helper for User Login
 */
export async function signInSupabaseUser({ email, password }) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Supabase Auth helper for resending verification email
 */
export async function resendSupabaseVerification(email) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await supabaseClient.auth.resend({
    type: 'signup',
    email
  });

  if (error) {
    throw error;
  }

  return data;
}
