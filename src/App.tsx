import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import PostsList from './components/PostsList'; // 导入PostsList组件

const App: React.FC = () => {
  return (
    <div>
      <h1>React + Electron!</h1>
      <p>Welcome to your React + Electron application.</p>
      <PostsList /> {/* 使用PostsList组件 */}
    </div>
  );
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);