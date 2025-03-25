import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChakraProvider, createStandaloneToast } from '@chakra-ui/react';
import YouTubeExtractor from './pages/YouTubeExtractor';
import YouTubeCallback from './pages/YouTubeCallback';

const { ToastContainer } = createStandaloneToast();

function App() {
  return (
    <ChakraProvider>
      <ToastContainer />
      <Router>
        <Routes>
          <Route path="/" element={<YouTubeExtractor />} />
          <Route path="/youtube-callback" element={<YouTubeCallback />} />
        </Routes>
      </Router>
    </ChakraProvider>
  );
}

export default App;
