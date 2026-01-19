# Project Architecture

This document describes the project structure and architecture for the Electron application, following enterprise-level standards for separation of concerns and scalability.

## Directory Structure

```text
src/
├── main/           # Main process code
│   └── index.ts    # Main process entry point
├── preload/        # Preload scripts
│   └── index.ts    # Preload entry point
├── renderer/       # Renderer process (React Frontend)
│   ├── components/ # UI components
│   ├── services/   # API and business logic services
│   ├── styles/     # Global styles and CSS
│   ├── lib/        # Third-party library configurations
│   ├── App.tsx     # Root React component
│   └── index.tsx   # Renderer entry point
└── shared/         # Shared code between processes
    ├── types/      # Common TypeScript types
    ├── utils/      # Common utility functions
    └── config/     # Shared configuration
```

## Process Separation

### Main Process (`src/main/`)
Responsible for lifecycle management, native API access, and heavy background tasks. It communicates with the renderer process via IPC.

### Preload Scripts (`src/preload/`)
Runs in a privileged context but has access to the DOM. Used to safely expose native APIs to the renderer process via `contextBridge`.

### Renderer Process (`src/renderer/`)
The web frontend of the application. It runs React and should NOT have direct access to Node.js APIs for security reasons. All native functionality should be accessed via the `window.electron` and `window.nodeManager` APIs exposed in the preload script.

### Shared Layer (`src/shared/`)
Contains code that is required by both the Main and Renderer processes, such as type definitions, shared constants, and pure utility functions.

## Development Standards

- **Alias usage**: Use `@/` for renderer-specific imports and `@shared/` for shared code.
- **IPC Communication**: Always use `ipcMain.handle` and `ipcRenderer.invoke` for asynchronous communication. Avoid `send`/`on` unless synchronous or fire-and-forget is strictly necessary.
- **Security**: Keep `contextIsolation` enabled and `nodeIntegration` disabled in the renderer process.
