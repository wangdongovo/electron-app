// src/config/env.ts
export const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:3000';
export const API_TIMEOUT = parseInt((import.meta as any).env.VITE_API_TIMEOUT || '10000', 10); // 10秒超时