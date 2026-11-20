import { supabase, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './supabase';

const endpoint = SUPABASE_URL + '/functions/v1/home-video';
const headers = { apikey: SUPABASE_PUBLISHABLE_KEY };
export const HOME_VIDEO_MAX_BYTES = 50 * 1024 * 1024;

export async function getHomeVideo(signal?: AbortSignal): Promise<string | null> {
  const response = await fetch(endpoint, { headers, signal });
  if (!response.ok) throw new Error('ভিডিওর তথ্য পাওয়া যায়নি।');
  const { videoUrl } = await response.json();
  return videoUrl ?? null;
}

export async function uploadHomeVideo(adminToken: string, file: File) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { ...headers, 'x-admin-token': adminToken },
  });
  if (response.status === 401) throw new Error('আবার অ্যাডমিন প্যানেলে লগইন করুন।');
  if (!response.ok) throw new Error('আপলোড শুরু করা যায়নি।');

  const { path, token } = await response.json();
  const video = file.slice(0, file.size, 'video/mp4');
  const { error } = await supabase.storage.from('homepage-video').uploadToSignedUrl(path, token, video, {
    contentType: 'video/mp4',
    cacheControl: '0',
  });
  if (error) throw new Error('ভিডিও আপলোড হয়নি। ফাইল ও ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।');
}
