import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ root: 'frontend', base: process.env.VITE_BASE_PATH ?? (process.env.VITE_DEMO_MODE === 'static' ? '/learning-platform-demo/' : '/'), plugins: [react()] });
