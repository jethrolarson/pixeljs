import { defineConfig } from 'vite'
import { resolve } from 'path'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'

export default defineConfig({
  publicDir: "public",
  plugins: [vanillaExtractPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        play: resolve(import.meta.dirname, "play.html"),
        edit: resolve(import.meta.dirname, "edit.html"),
        browse: resolve(import.meta.dirname, "browse.html"),
        workshop: resolve(import.meta.dirname, "workshop.html"),
        pack: resolve(import.meta.dirname, "pack.html"),
        packEdit: resolve(import.meta.dirname, "pack-edit.html"),
        admin: resolve(import.meta.dirname, "admin.html"),
        profile: resolve(import.meta.dirname, "profile.html"),
      },
    },
  },
});
