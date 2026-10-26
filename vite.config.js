import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'three-core', test: /node_modules[\\/]three[\\/]src[\\/](core|math|materials|objects|scenes|textures|cameras|lights|geometries)[\\/]/ },
            { name: 'three-engine', test: /node_modules[\\/]three[\\/]/ },
          ],
        },
      },
    },
  },
})
