import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ChakraProvider, createStandaloneToast } from '@chakra-ui/react';
import YouTubeExtractor from './pages/YouTubeExtractor';
import YouTubeCallback from './pages/YouTubeCallback';

const { ToastContainer } = createStandaloneToast();

function App() {
  return (
    <ChakraProvider>
      <ToastContainer />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<YouTubeExtractor />} />
          <Route path="youtube-callback" element={<YouTubeCallback />} />
          <Route path="index.html/youtube-callback" element={<YouTubeCallback />} />
        </Routes>
      </BrowserRouter>
    </ChakraProvider>
  );
}

export default App;
