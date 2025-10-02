/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_USE_WORKER_PROXY: string;
  readonly VITE_WORKER_URL: string;
  readonly VITE_DEBUG: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ImportMeta {
  readonly env: ImportMetaEnv;
}


// Global type declarations for browser APIs
declare global {
  interface Window {
    alert: (message?: string) => void;
  }
  
  const File: {
    new (fileBits: BlobPart[], fileName: string, options?: FilePropertyBag): File;
  };
  
  const FileReader: {
    new (): FileReader;
    readonly EMPTY: number;
    readonly LOADING: number;
    readonly DONE: number;
    readonly readyState: number;
    readonly result: string | ArrayBuffer | null;
    readonly error: DOMException | null;
    onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null;
    onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null;
    onabort: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null;
    onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null;
    onloadstart: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null;
    onprogress: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null;
    abort(): void;
    readAsArrayBuffer(blob: Blob): void;
    readAsBinaryString(blob: Blob): void;
    readAsDataURL(blob: Blob): void;
    readAsText(blob: Blob, encoding?: string): void;
  };
  
  const Blob: {
    new (blobParts?: BlobPart[], options?: BlobPropertyBag): Blob;
  };
  
  const URL: {
    createObjectURL(object: File | Blob | MediaSource): string;
    revokeObjectURL(url: string): void;
  };
  
  const Image: {
    new (): HTMLImageElement;
  };
  
  const ImageBitmap: {
    new (): ImageBitmap;
  };
  
  const createImageBitmap: {
    (image: ImageBitmapSource, sx?: number, sy?: number, sw?: number, sh?: number): Promise<ImageBitmap>;
    (image: ImageBitmapSource, options?: ImageBitmapOptions): Promise<ImageBitmap>;
  };
  
  const ImageOrientation: {
    new (): ImageOrientation;
  };
  
  const HTMLCanvasElement: {
    new (): HTMLCanvasElement;
  };
  
  const HTMLInputElement: {
    new (): HTMLInputElement;
  };
  
  const HTMLImageElement: {
    new (): HTMLImageElement;
  };
  
  const HTMLVideoElement: {
    new (): HTMLVideoElement;
  };
  
  const HTMLDivElement: {
    new (): HTMLDivElement;
  };
  
  const HTMLElement: {
    new (): HTMLElement;
  };
  
  const Element: {
    new (): Element;
  };
  
  const KeyboardEvent: {
    new (type: string, eventInitDict?: KeyboardEventInit): KeyboardEvent;
  };
  
  const ErrorEvent: {
    new (type: string, eventInitDict?: ErrorEventInit): ErrorEvent;
  };
  
  const IntersectionObserver: {
    new (callback: IntersectionObserverCallback, options?: IntersectionObserverInit): IntersectionObserver;
  };
  
  const IntersectionObserverEntry: {
    new (): IntersectionObserverEntry;
  };
  
  const IntersectionObserverInit: {
    new (): IntersectionObserverInit;
  };
  
  const IntersectionObserverCallback: {
    new (): IntersectionObserverCallback;
  };
  
  const PushSubscription: {
    new (): PushSubscription;
  };
  
  const ServiceWorkerRegistration: {
    new (): ServiceWorkerRegistration;
  };
  
  const NotificationPermission: {
    new (): NotificationPermission;
  };
  
  const Notification: {
    new (title: string, options?: NotificationOptions): Notification;
  };
  
  const URLSearchParams: {
    new (init?: string[][] | Record<string, string> | string): URLSearchParams;
  };
  
  const BufferSource: {
    new (): BufferSource;
  };
  
  const navigator: Navigator;
  
  const performance: Performance;
  
  const setTimeout: (handler: TimerHandler, timeout?: number, ...arguments: unknown[]) => number;
  const clearTimeout: (id?: number) => void;
  const setInterval: (handler: TimerHandler, timeout?: number, ...arguments: unknown[]) => number;
  const clearInterval: (id?: number) => void;
  const requestAnimationFrame: (callback: FrameRequestCallback) => number;
  
  const alert: (message?: string) => void;
  
  namespace NodeJS {
    interface Timeout {
      ref(): this;
      unref(): this;
    }
  }
}

export {};
