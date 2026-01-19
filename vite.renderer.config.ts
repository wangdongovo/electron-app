import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config
export default defineConfig({
    plugins: [
        react(),
    ],
    resolve: {
        alias: [
            { find: '@', replacement: path.resolve(__dirname, 'src/renderer') },
            { find: '@shared', replacement: path.resolve(__dirname, 'src/shared') }
        ],
    },
    server: {
        proxy: {
            // 代理所有 /api 开头的请求到后端服务器
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ''),
                configure: (proxy) => {
                    proxy.on('error', (err) => {
                        console.log('proxy error', err);
                    });
                    proxy.on('proxyReq', (proxyReq, req) => {
                        console.log('Sending Request to the Target:', req.method, req.url);
                    });
                    proxy.on('proxyRes', (proxyRes, req) => {
                        console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
                    });
                },
            },
        },
    },
});
