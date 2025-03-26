const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
// 개발 환경과 운영 환경의 리디렉션 URI 분리
const REDIRECT_URI = import.meta.env.NODE_ENV === 'production' 
  ? 'https://leessosso.github.io/youtube-callback'
  : `${window.location.origin}/youtube-callback`;

export const initYouTubeAuth = () => {
  const scopes = [
    'https://www.googleapis.com/auth/youtube.force-ssl',
    'https://www.googleapis.com/auth/youtube'
  ].join(' ');

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.append('client_id', CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', scopes);
  authUrl.searchParams.append('access_type', 'offline');
  authUrl.searchParams.append('prompt', 'consent');

  window.location.href = authUrl.toString();
};

export const handleAuthCallback = async (code: string) => {
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();
    localStorage.setItem('youtube_access_token', tokens.access_token);
    localStorage.setItem('youtube_refresh_token', tokens.refresh_token);
    return true;
  } catch (error) {
    console.error('Auth callback error:', error);
    return false;
  }
};

export const logout = () => {
  localStorage.removeItem('youtube_access_token');
  localStorage.removeItem('youtube_refresh_token');
  window.location.reload();
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('youtube_access_token');
}; 