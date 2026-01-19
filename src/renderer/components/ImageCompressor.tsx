import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download } from 'lucide-react';

type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp';

interface CompressedItem {
  id: string;
  name: string;
  originalSize: number;
  originalType: string;
  originalURL: string;
  compressedBlob: Blob;
  compressedSize: number;
  compressedType: OutputFormat;
  compressedURL: string;
  width: number;
  height: number;
  durationMs: number;
  createdAt: number;
  createdAtText: string;
  displayName: string;
}

const bytesToText = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 2)} ${sizes[i]}`;
};

const loadImageFromFile = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = reader.result as string;
    };
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });

const computeScaledDims = (
  w: number,
  h: number,
  maxW?: number,
  maxH?: number
) => {
  let scale = 1;
  if (maxW && maxW > 0) {
    scale = Math.min(scale, maxW / w);
  }
  if (maxH && maxH > 0) {
    scale = Math.min(scale, maxH / h);
  }
  if (scale > 1) scale = 1;
  const sw = Math.max(1, Math.round(w * scale));
  const sh = Math.max(1, Math.round(h * scale));
  return { sw, sh };
};

const blobFromCanvas = async (
  canvas: HTMLCanvasElement,
  type: OutputFormat,
  quality?: number
): Promise<Blob> => {
  const blob = await new Promise<Blob | null>((resolve) => {
    if (type === 'image/png') {
      canvas.toBlob((b) => resolve(b), 'image/png');
    } else if (type === 'image/jpeg') {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
    } else {
      canvas.toBlob((b) => resolve(b), 'image/webp', quality);
    }
  });
  if (blob) return blob;
  const dataUrl = canvas.toDataURL(type, quality);
  const res = await fetch(dataUrl);
  return await res.blob();
};

const formatTimestamp = (date: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

const ImageCompressor: React.FC = () => {
  const [items, setItems] = useState<CompressedItem[]>([]);
  const [quality, setQuality] = useState(0.8);
  const [format, setFormat] = useState<OutputFormat>('image/webp');
  const [maxWidth, setMaxWidth] = useState<number | ''>('');
  const [maxHeight, setMaxHeight] = useState<number | ''>('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handlePickFiles = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFilesChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const results: CompressedItem[] = [];

    for (const f of files) {
      const startedAt = performance.now();
      const now = new Date();
      const createdAtText = formatTimestamp(now);
      const createdAt = now.getTime();
      const displayName = `systemdash-${createdAtText}`;
      try {
        const originalImg = await loadImageFromFile(f);
        const originalURL = originalImg.src;
        const { sw, sh } = computeScaledDims(
          originalImg.naturalWidth || originalImg.width,
          originalImg.naturalHeight || originalImg.height,
          typeof maxWidth === 'number' ? maxWidth : undefined,
          typeof maxHeight === 'number' ? maxHeight : undefined
        );

        const canvas = document.createElement('canvas');
        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        ctx.drawImage(originalImg, 0, 0, sw, sh);

        const blob = await blobFromCanvas(canvas, format, quality);
        const compressedURL = URL.createObjectURL(blob);
        const durationMs = performance.now() - startedAt;
        results.push({
          id: `${f.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: f.name,
          originalSize: f.size,
          originalType: f.type,
          originalURL,
          compressedBlob: blob,
          compressedSize: blob.size,
          compressedType: format,
          compressedURL,
          width: sw,
          height: sh,
          durationMs,
          createdAt,
          createdAtText,
          displayName,
        });
      } catch {
        continue;
      }
    }

    setItems(prev => [...prev, ...results]);
    e.target.value = '';
  }, [format, quality, maxWidth, maxHeight]);

  const totalSaving = useMemo(() => {
    const original = items.reduce((acc, it) => acc + it.originalSize, 0);
    const compressed = items.reduce((acc, it) => acc + it.compressedSize, 0);
    const diff = original - compressed;
    const ratio = original > 0 ? (compressed / original) : 0;
    return { original, compressed, diff, ratio };
  }, [items]);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => b.createdAt - a.createdAt),
    [items],
  );

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(sortedItems.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [items.length]);

  const pagedItems = useMemo(
    () => sortedItems.slice((page - 1) * pageSize, page * pageSize),
    [sortedItems, page, pageSize],
  );

  const handleDownload = useCallback((item: CompressedItem) => {
    const a = document.createElement('a');
    a.href = item.compressedURL;
    const ext = item.compressedType === 'image/jpeg' ? 'jpg' : item.compressedType === 'image/webp' ? 'webp' : 'png';
    const base = `systemdash-${item.createdAtText}`;
    a.download = `${base}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  const handleClear = useCallback(() => {
    for (const it of items) {
      URL.revokeObjectURL(it.originalURL);
      URL.revokeObjectURL(it.compressedURL);
    }
    setItems([]);
  }, [items]);

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePickFiles}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500"
          >
            选择图片
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="hidden"
            onChange={handleFilesChange}
          />
          <button
            onClick={handleClear}
            className="px-3 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            清空列表
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-600">输出格式</span>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as OutputFormat)}
              className="px-2 py-1 rounded-lg border border-zinc-200 text-sm bg-white"
            >
              <option value="image/webp">WebP</option>
              <option value="image/jpeg">JPG</option>
              <option value="image/png">PNG</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-600">质量</span>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
            />
            <span className="text-sm text-zinc-700 w-10 text-right">{Math.round(quality * 100)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-600">最大宽</span>
            <input
              type="number"
              min={1}
              placeholder="原尺寸"
              value={maxWidth}
              onChange={(e) => setMaxWidth(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              className="w-24 px-2 py-1 rounded-lg border border-zinc-200 text-sm bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-600">最大高</span>
            <input
              type="number"
              min={1}
              placeholder="按比例"
              value={maxHeight}
              onChange={(e) => setMaxHeight(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              className="w-24 px-2 py-1 rounded-lg border border-zinc-200 text-sm bg-white"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl p-4 flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-800">概览</h3>
        </div>
        <div className="space-y-2 flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2">
          {pagedItems.map(it => {
            const ratio = it.originalSize > 0 ? (it.compressedSize / it.originalSize) * 100 : 0;
            const saved = 100 - ratio;
            return (
              <div key={it.id} className="border border-zinc-200 rounded-xl p-3 flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center overflow-hidden">
                  <img src={it.compressedURL} alt={it.name} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-zinc-900 truncate">{it.displayName}</div>
                      <div className="text-xs text-zinc-600">
                        {bytesToText(it.originalSize)} → {bytesToText(it.compressedSize)} ({ratio.toFixed(1)}%)
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        时间: {it.createdAtText} | 耗时: {it.durationMs.toFixed(0)} ms | 节省: {saved.toFixed(1)}% | 尺寸: {it.width}×{it.height}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(it)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                      aria-label="下载"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {items.length === 0 && (
            <div className="text-sm text-zinc-500">请选择图片以开始压缩</div>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
          <div>
            第 {page}/{totalPages} 页，共 {sortedItems.length} 项
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className={`px-2 py-1 rounded border ${
                page <= 1
                  ? 'border-zinc-200 text-zinc-300 cursor-not-allowed'
                  : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              上一页
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className={`px-2 py-1 rounded border ${
                page >= totalPages
                  ? 'border-zinc-200 text-zinc-300 cursor-not-allowed'
                  : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCompressor;
