/// <reference types="vite/client" />
// src/services/apiClient.ts
import axios from 'axios';

// 创建axios实例
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000', 10), // 10秒超时
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证token
    console.log('API Request:', config.method?.toUpperCase(), config.url, config.data);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    // 添加响应日志
    console.log('API Response:', response.config?.method?.toUpperCase(), response.config?.url, response.data);
    return response; // 返回完整响应对象以匹配 axios 类型
  },
  (error) => {
    // 错误处理
    console.error('API Response Error:', error.config?.method?.toUpperCase(), error.config?.url, error);
    
    // 根据错误状态码进行不同处理
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 未授权处理
          break;
        case 403:
          // 禁止访问处理
          break;
        case 404:
          // 资源不存在处理
          break;
        case 500:
          // 服务器错误处理
          break;
        default:
          // 其他错误处理
      }
    } else if (error.request) {
      // 请求发出但没有收到响应
      console.error('No response received:', error.request);
    } else {
      // 请求配置错误
      console.error('Request configuration error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;