import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/youtube-playlist/', // GitHub Pages 배포를 위한 base 경로 설정
})
