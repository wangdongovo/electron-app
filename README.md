# Project Alpha (Electron App) 技术文档

## 1. 项目概览
本项目是一个基于 Electron 的企业级 Mac 应用程序，采用了现代化的前端技术栈，旨在提供原生应用的高性能与 Web 开发的灵活性。

## 2. 技术栈
- **核心框架**: Electron 39
- **前端框架**: React 19
- **构建工具**: Vite 5 + Electron Forge 7
- **语言**: TypeScript
- **样式**: Tailwind CSS v4 + PostCSS
- **UI 组件库**: shadcn/ui (Radix UI)
- **状态管理/数据请求**: Axios

## 3. 项目目录结构
```text
.
├── src/
│   ├── components/       # UI 组件
│   │   ├── ui/           # shadcn 基础组件
│   │   ├── layout/       # 布局组件 (Sidebar, Header)
│   │   └── ...           # 业务组件
│   ├── services/         # API 服务与请求封装
│   ├── lib/              # 工具函数 (cn, etc.)
│   ├── config/           # 全局配置
│   ├── types/            # TypeScript 类型定义
│   ├── main.ts           # Electron 主进程入口
│   ├── preload.ts        # 预加载脚本 (IPC 桥接)
│   ├── renderer.ts       # 渲染进程入口
│   └── App.tsx           # React 根组件
├── forge.config.ts       # Electron Forge 打包配置
├── vite.main.config.ts   # 主进程 Vite 配置
├── vite.renderer.config.ts # 渲染进程 Vite 配置
└── components.json       # shadcn/ui 配置
```

## 4. 开发规范
### 4.1 安全规范
- **Context Isolation**: 必须启用，确保渲染进程与 Electron 内部 API 隔离。
- **Node Integration**: 必须禁用，渲染进程不得直接访问 Node.js API。
- **IPC 通信**: 所有主进程与渲染进程的交互必须通过 `preload.ts` 使用 `contextBridge` 进行。

### 4.2 路由与导航
- 应用当前使用单页面布局，配合 Sidebar 进行功能切换。

### 4.3 样式规范
- 统一使用 Tailwind CSS 类名。
- 颜色与圆角应遵循 `@theme` 定义，保持设计一致性。
