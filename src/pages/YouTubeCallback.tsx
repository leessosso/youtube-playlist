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
          navigate('/');
        } else {
          navigate('/?error=auth_failed');
        }
      } else {
        navigate('/?error=no_code');
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