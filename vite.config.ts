import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/jw-talk-assistant/',
  plugins: [react()],
})
