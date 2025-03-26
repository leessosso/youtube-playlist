import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleAuthCallback } from '../utils/youtubeAuth';

export default function YouTubeCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        const success = await handleAuthCallback(code);
        if (success) {
          navigate(import.meta.env.NODE_ENV === 'production' ? '/youtube-playlist/' : '/');
        } else {
          navigate(import.meta.env.NODE_ENV === 'production' ? '/youtube-playlist/?error=auth_failed' : '/?error=auth_failed');
        }
      } else {
        navigate(import.meta.env.NODE_ENV === 'production' ? '/youtube-playlist/?error=no_code' : '/?error=no_code');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">인증 처리 중...</h1>
      <p>잠시만 기다려주세요.</p>
    </div>
  );
} 