import { useEffect, useState, type FormEvent } from 'react';
import { getHomeVideo, HOME_VIDEO_MAX_BYTES, uploadHomeVideo } from '../services/homeVideoService';

export default function HomeVideoManager({ adminToken }: { adminToken: string }) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    void getHomeVideo(controller.signal).then(setVideoUrl).catch(() => {
      if (!controller.signal.aborted) setMessage('বর্তমান ভিডিওর তথ্য পাওয়া যায়নি।');
    });
    return () => controller.abort();
  }, []);

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!file || uploading) return;
    if (!/\.mp4$/i.test(file.name) || !file.size || file.size > HOME_VIDEO_MAX_BYTES) {
      setMessage('সর্বোচ্চ ৫০ MB-এর একটি MP4 ফাইল বাছুন।');
      return;
    }

    setUploading(true);
    setMessage('');
    try {
      await uploadHomeVideo(adminToken, file);
      form.reset();
      setFile(null);
      setMessage('হোমপেজে ভিডিও প্রকাশ হয়েছে।');
      try {
        setVideoUrl(await getHomeVideo());
      } catch {
        setMessage('ভিডিও প্রকাশ হয়েছে। নতুন ভিডিও দেখতে হোমপেজ রিফ্রেশ করুন।');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'ভিডিও আপলোড হয়নি।');
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="max-w-2xl space-y-4 rounded-2xl border border-stone-200 bg-white p-5" aria-labelledby="home-video-admin-title">
      <h2 id="home-video-admin-title" className="text-xl font-bold">হোমপেজ ভিডিও</h2>
      {videoUrl && <video key={videoUrl} src={videoUrl} controls playsInline preload="metadata" className="aspect-video w-full rounded-xl bg-black" />}
      <form onSubmit={publish} className="space-y-3">
        <label htmlFor="home-video-file" className="block text-sm font-semibold">ভিডিও বাছুন (MP4, সর্বোচ্চ ৫০ MB)</label>
        <input id="home-video-file" type="file" accept=".mp4,video/mp4" required disabled={uploading}
          onChange={event => setFile(event.currentTarget.files?.[0] ?? null)} className="block w-full text-sm" />
        <button type="submit" disabled={!file || uploading} className="min-h-11 rounded-xl bg-emerald-800 px-4 font-semibold text-white disabled:opacity-50">
          {uploading ? 'আপলোড হচ্ছে…' : 'আপলোড ও প্রকাশ করুন'}
        </button>
        <p role="status" className="text-sm text-stone-700">{message}</p>
      </form>
    </section>
  );
}
