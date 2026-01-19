import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    lib: {
      entry: 'src/main/index.ts',
      formats: ['cjs'],
    },
    rollupOptions: {
      external: [
        'electron',
        'node:path',
        'node:fs',
        'node:os',
        'node:https',
        'node:child_process',
        'node:util',
      ],
      output: {
        entryFileNames: 'main.js',
      },
    },
  },
});
