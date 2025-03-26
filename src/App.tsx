import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider, createStandaloneToast } from '@chakra-ui/react';
import YouTubeExtractor from './pages/YouTubeExtractor';
import { useEffect } from 'react';
import { handleAuthCallback } from './utils/youtubeAuth';

const { ToastContainer } = createStandaloneToast();

function App() {
  useEffect(() => {
    // URL에 code 파라미터가 있으면 인증 처리
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      handleAuthCallback(code).then(success => {
        if (success) {
          // 인증 처리 후 URL에서 code 파라미터 제거
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }
      });
    }
  }, []);

  return (
    <ChakraProvider>
      <ToastContainer />
      <Router basename="/youtube-playlist">
        <Routes>
          <Route path="/" element={<YouTubeExtractor />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ChakraProvider>
  );
}

export default App;
