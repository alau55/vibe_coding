import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and Anon Key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate that environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Helper function to get the current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error fetching user:', error.message);
    return null;
  }
  return user;
};

// Helper function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error.message);
    throw error;
  }
};

// Helper function to get property image URL from Supabase Storage
export const getPropertyImageUrl = (imagePath) => {
  if (!imagePath) return null;

  // If it's already a full URL (like Unsplash), return it
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  // Otherwise, construct Supabase Storage URL
  const { data } = supabase.storage
    .from('property-images')
    .getPublicUrl(imagePath);

  return data.publicUrl;
};

// Helper function to upload property image to Supabase Storage
export const uploadPropertyImage = async (file) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = fileName;

    const { data, error } = await supabase.storage
      .from('property-images')
      .upload(filePath, file);

    if (error) {
      throw error;
    }

    return filePath;
  } catch (error) {
    console.error('Error uploading image:', error.message);
    throw error;
  }
};
