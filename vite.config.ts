import { defineConfig } from 'vite'
import { resolve } from 'path'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'

export default defineConfig({
  publicDir: 'public',
  plugins: [vanillaExtractPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        play: resolve(__dirname, 'play.html'),
        edit: resolve(__dirname, 'edit.html'),
        browse: resolve(__dirname, 'browse.html'),
        workshop: resolve(__dirname, 'workshop.html'),
        pack: resolve(__dirname, 'pack.html'),
        packEdit: resolve(__dirname, 'pack-edit.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
    },
  },
})
