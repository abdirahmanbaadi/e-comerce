import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const useHttps =
  process.env.VITE_DEV_HTTPS === '1' || process.argv.includes('--https');

export default defineConfig(async () => {
  const plugins = [react()];
  if (useHttps) {
    const { default: basicSsl } = await import('@vitejs/plugin-basic-ssl');
    plugins.push(basicSsl());
  }
  return {
    plugins,
    server: {
      host: true,
      port: 5173,
      strictPort: true,
      https: useHttps || undefined,
      allowedHosts: true,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
        '/uploads': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
  };
});
