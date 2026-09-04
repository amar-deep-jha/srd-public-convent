import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: resolve(root, 'index.html'),
        about: resolve(root, 'about.html'),
        academics: resolve(root, 'academics.html'),
        facilities: resolve(root, 'facilities.html'),
        admissions: resolve(root, 'admissions.html'),
        contact: resolve(root, 'contact.html')
      }
    }
  }
});
