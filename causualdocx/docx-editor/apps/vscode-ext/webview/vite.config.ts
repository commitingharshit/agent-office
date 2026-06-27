import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import path from 'path';

const monorepoRoot = path.resolve(__dirname, '../../..');

export default defineConfig({
  base: './',
  plugins: [react()],
  root: path.resolve(__dirname, 'src'),
  worker: {
    format: 'es',
  },
  build: {
    manifest: 'manifest.json',
    outDir: path.resolve(__dirname, 'dist'),
    rollupOptions: {
      input: path.resolve(__dirname, 'src/main.tsx'),
      output: {
        entryFileNames: 'main.js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
  resolve: {
    alias: [
      {
        find: '@casualoffice/docs',
        replacement: path.resolve(__dirname, '../../../packages/react/src/index.ts'),
      },
      {
        find: /^@casualoffice\/docs\/(.*)$/,
        replacement: path.resolve(__dirname, '../../../packages/react/src/$1'),
      },
      {
        find: /^@eigenpal\/docx-core$/,
        replacement: path.resolve(__dirname, '../../../packages/core/src/core.ts'),
      },
      {
        find: /^@eigenpal\/docx-core\/(.*)$/,
        replacement: path.resolve(__dirname, '../../../packages/core/src/$1'),
      },
    ],
  },
  css: {
    transformer: 'postcss',
    postcss: {
      plugins: [
        tailwindcss({
          config: path.join(monorepoRoot, 'tailwind.config.js'),
          content: {
            files: [
              path.join(monorepoRoot, 'packages/react/src/**/*.{ts,tsx}'),
              path.join(__dirname, 'src/**/*.{ts,tsx}'),
            ],
          },
          safelist: [{ pattern: /.*/ }],
        }),
        autoprefixer(),
      ],
    },
  },
});
