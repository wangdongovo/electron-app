import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import PostsList from './components/PostsList'; // 导入PostsList组件
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <h1 className="text-4xl font-bold mb-4">React + Electron with Tailwind & shadcn/ui</h1>
      <p className="mb-6">Welcome to your styled Electron application.</p>
      <div className="flex space-x-4 mb-6">
        <Button variant="default">Default Button</Button>
        <Button variant="outline">Outline Button</Button>
      </div>
      <Card className="mb-6">
        <h2 className="text-2xl font-semibold">Demo Card</h2>
        <p className="mt-2">This is a shadcn/ui Card component styled with Tailwind.</p>
      </Card>
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