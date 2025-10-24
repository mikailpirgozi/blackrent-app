/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_USE_WORKER_PROXY: string;
  readonly VITE_WORKER_URL: string;
  readonly VITE_DEBUG: string;
}

interface _ImportMeta {
  readonly env: ImportMetaEnv;
}

// Globálne typy pre DOM API
declare global {
  // Basic DOM types
  var _alert: (_message?: string) => void;
  var _setTimeout: (
    _callback: (..._args: unknown[]) => void,
    _ms: number,
    ..._args: unknown[]
  ) => number;
  var _clearTimeout: (_id: number) => void;
  var _setInterval: (
    _callback: (..._args: unknown[]) => void,
    _ms: number,
    ..._args: unknown[]
  ) => number;
  var _clearInterval: (_id: number) => void;
  var _window: Window & typeof globalThis;
  var _navigator: Navigator;
  var _caches: CacheStorage;
  var _performance: Performance;
  var _console: Console;

  // Event types
  interface Event {
    readonly type: string;
    readonly target: EventTarget | null;
    readonly currentTarget: EventTarget | null;
    readonly bubbles: boolean;
    readonly cancelable: boolean;
    readonly defaultPrevented: boolean;
    readonly eventPhase: number;
    readonly isTrusted: boolean;
    readonly timeStamp: number;
    preventDefault(): void;
    stopPropagation(): void;
    stopImmediatePropagation(): void;
    initEvent(_type: string, _bubbles?: boolean, _cancelable?: boolean): void;
  }

  interface EventTarget {
    addEventListener(
      _type: string,
      _listener: EventListenerOrEventListenerObject
    ): void;
    removeEventListener(
      _type: string,
      _listener: EventListenerOrEventListenerObject
    ): void;
    dispatchEvent(_event: Event): boolean;
  }

  interface EventListener {
    (_evt: Event): void;
  }

  interface EventListenerObject {
    handleEvent(_evt: Event): void;
  }

  type EventListenerOrEventListenerObject = EventListener | EventListenerObject;

  // Custom Event
  interface _CustomEvent<T = unknown> extends Event {
    readonly detail: T;
  }

  // Message Event
  interface _MessageEvent<T = unknown> extends Event {
    readonly data: T;
    readonly origin: string;
    readonly lastEventId: string;
    readonly source: MessagePort | null;
    readonly ports: ReadonlyArray<MessagePort>;
  }

  // Service Worker types
  interface _ServiceWorkerRegistration {
    readonly scope: string;
    readonly installing: ServiceWorker | null;
    readonly waiting: ServiceWorker | null;
    readonly active: ServiceWorker | null;
    addEventListener(
      _type: string,
      _listener: EventListenerOrEventListenerObject
    ): void;
    removeEventListener(
      _type: string,
      _listener: EventListenerOrEventListenerObject
    ): void;
    update(): Promise<void>;
    unregister(): Promise<boolean>;
  }

  // Push notification types
  type _NotificationPermission = 'default' | 'granted' | 'denied';

  interface Notification extends EventTarget {
    readonly title: string;
    readonly body: string;
    readonly icon: string;
    readonly badge: string;
    readonly tag: string;
    readonly data: unknown;
    readonly requireInteraction: boolean;
    readonly silent: boolean;
    readonly timestamp: number;
    readonly actions: NotificationAction[];
    close(): void;
  }

  interface NotificationAction {
    action: string;
    title: string;
    icon?: string;
  }

  interface NotificationConstructor {
    new (_title: string, _options?: NotificationOptions): Notification;
  }

  var Notification: NotificationConstructor;

  interface NotificationOptions {
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: unknown;
    requireInteraction?: boolean;
    silent?: boolean;
    timestamp?: number;
    actions?: NotificationAction[];
  }

  // Push subscription types
  interface _PushSubscription {
    readonly endpoint: string;
    readonly expirationTime: number | null;
    readonly options: PushSubscriptionOptions;
    getKey(_name: PushEncryptionKeyName): ArrayBuffer | null;
    toJSON(): PushSubscriptionJSON;
  }

  interface PushSubscriptionOptions {
    readonly applicationServerKey: ArrayBuffer | null;
    readonly userVisibleOnly: boolean;
  }

  interface PushSubscriptionJSON {
    endpoint: string;
    expirationTime: number | null;
    keys: {
      p256dh: string;
      auth: string;
    };
  }

  type PushEncryptionKeyName = 'p256dh' | 'auth';

  // Cache API types
  interface Cache {
    add(_request: Request | string): Promise<void>;
    addAll(_requests: Array<Request | string>): Promise<void>;
    delete(
      _request: Request | string,
      _options?: CacheQueryOptions
    ): Promise<boolean>;
    keys(
      _request?: Request | string,
      _options?: CacheQueryOptions
    ): Promise<ReadonlyArray<Request>>;
    match(
      _request: Request | string,
      _options?: CacheQueryOptions
    ): Promise<Response | undefined>;
    matchAll(
      _request?: Request | string,
      _options?: CacheQueryOptions
    ): Promise<ReadonlyArray<Response>>;
    put(_request: Request | string, _response: Response): Promise<void>;
  }

  interface CacheQueryOptions {
    ignoreMethod?: boolean;
    ignoreSearch?: boolean;
    ignoreVary?: boolean;
  }

  interface _CacheStorage {
    delete(_cacheName: string): Promise<boolean>;
    has(_cacheName: string): Promise<boolean>;
    keys(): Promise<ReadonlyArray<string>>;
    match(
      _request: Request | string,
      _options?: MultiCacheQueryOptions
    ): Promise<Response | undefined>;
    open(_cacheName: string): Promise<Cache>;
  }

  interface MultiCacheQueryOptions extends CacheQueryOptions {
    cacheName?: string;
  }

  // Message Channel types
  interface MessageChannel {
    readonly port1: MessagePort;
    readonly port2: MessagePort;
  }

  interface MessageChannelConstructor {
    new (): MessageChannel;
  }

  var MessageChannel: MessageChannelConstructor;

  interface MessagePort extends EventTarget {
    postMessage(_message: unknown, _transfer?: Transferable[]): void;
    start(): void;
    close(): void;
    addEventListener(
      _type: string,
      _listener: EventListenerOrEventListenerObject
    ): void;
    removeEventListener(
      _type: string,
      _listener: EventListenerOrEventListenerObject
    ): void;
  }

  // URL Search Params
  interface URLSearchParams {
    append(_name: string, _value: string): void;
    delete(_name: string): void;
    get(_name: string): string | null;
    getAll(_name: string): string[];
    has(_name: string): boolean;
    set(_name: string, _value: string): void;
    sort(): void;
    toString(): string;
    forEach(
      _callbackfn: (
        _value: string,
        _key: string,
        _parent: URLSearchParams
      ) => void,
      _thisArg?: unknown
    ): void;
  }

  interface URLSearchParamsConstructor {
    new (
      _init?: string | string[][] | Record<string, string> | URLSearchParams
    ): URLSearchParams;
  }

  var URLSearchParams: URLSearchParamsConstructor;

  // Image constructor
  interface ImageConstructor {
    new (_width?: number, _height?: number): HTMLImageElement;
  }

  var _Image: ImageConstructor;

  // Blob constructor
  interface Blob {
    size: number;
    type: string;
    slice(_start?: number, _end?: number, _contentType?: string): Blob;
  }

  interface BlobConstructor {
    new (_blobParts?: BlobPart[], _options?: BlobPropertyBag): Blob;
  }

  var Blob: BlobConstructor;

  interface BlobPropertyBag {
    type?: string;
    endings?: 'transparent' | 'native';
  }

  type BlobPart = BufferSource | Blob | string;
  type BufferSource = ArrayBufferView | ArrayBuffer;

  // FormData constructor
  interface FormData {
    append(_name: string, _value: string | Blob, _fileName?: string): void;
    delete(_name: string): void;
    get(_name: string): FormDataEntryValue | null;
    getAll(_name: string): FormDataEntryValue[];
    has(_name: string): boolean;
    set(_name: string, _value: string | Blob, _fileName?: string): void;
  }

  interface FormDataConstructor {
    new (_form?: HTMLFormElement): FormData;
  }

  var FormData: FormDataConstructor;

  type FormDataEntryValue = File | string;

  // HTML Element types
  interface _HTMLInputElement {
    value: string;
    checked: boolean;
    disabled: boolean;
    readonly: boolean;
    required: boolean;
    type: string;
    name: string;
    placeholder: string;
    min: string;
    max: string;
    step: string;
    pattern: string;
    autocomplete: string;
    autofocus: boolean;
    form: HTMLFormElement | null;
    validity: ValidityState;
    willValidate: boolean;
    validationMessage: string;
    checkValidity(): boolean;
    reportValidity(): boolean;
    setCustomValidity(_message: string): void;
    select(): void;
    setSelectionRange(_start: number, _end: number): void;
    setRangeText(
      _replacement: string,
      _start?: number,
      _end?: number,
      _selectionMode?: SelectionMode
    ): void;
    addEventListener(
      _type: string,
      _listener: EventListenerOrEventListenerObject
    ): void;
    removeEventListener(
      _type: string,
      _listener: EventListenerOrEventListenerObject
    ): void;
  }

  interface _HTMLDivElement {
    addEventListener(
      _type: string,
      _listener: EventListenerOrEventListenerObject
    ): void;
    removeEventListener(
      _type: string,
      _listener: EventListenerOrEventListenerObject
    ): void;
  }

  interface _HTMLButtonElement {
    disabled: boolean;
    type: string;
    value: string;
    form: HTMLFormElement | null;
    addEventListener(
      _type: string,
      _listener: EventListenerOrEventListenerObject
    ): void;
    removeEventListener(
      _type: string,
      _listener: EventListenerOrEventListenerObject
    ): void;
  }

  interface HTMLFormElement {
    elements: HTMLFormControlsCollection;
    addEventListener(
      _type: string,
      _listener: EventListenerOrEventListenerObject
    ): void;
    removeEventListener(
      _type: string,
      _listener: EventListenerOrEventListenerObject
    ): void;
  }

  interface _HTMLSpanElement {
    addEventListener(
      _type: string,
      _listener: EventListenerOrEventListenerObject
    ): void;
    removeEventListener(
      _type: string,
      _listener: EventListenerOrEventListenerObject
    ): void;
  }

  interface HTMLImageElement {
    src: string;
    width: number;
    height: number;
    alt: string;
    addEventListener(
      _type: string,
      _listener: EventListenerOrEventListenerObject
    ): void;
    removeEventListener(
      _type: string,
      _listener: EventListenerOrEventListenerObject
    ): void;
  }

  interface HTMLFormControlsCollection {
    [index: number]: Element;
    length: number;
  }

  interface Element {
    addEventListener(
      _type: string,
      _listener: EventListenerOrEventListenerObject
    ): void;
    removeEventListener(
      _type: string,
      _listener: EventListenerOrEventListenerObject
    ): void;
  }

  interface File {
    name: string;
    size: number;
    type: string;
    lastModified: number;
  }

  interface ValidityState {
    valueMissing: boolean;
    typeMismatch: boolean;
    patternMismatch: boolean;
    tooLong: boolean;
    tooShort: boolean;
    rangeUnderflow: boolean;
    rangeOverflow: boolean;
    stepMismatch: boolean;
    badInput: boolean;
    customError: boolean;
    valid: boolean;
  }

  type SelectionMode = 'select' | 'start' | 'end' | 'preserve';

  // Browser API Extensions
  interface Navigator {
    deviceMemory?: number;
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
    standalone?: boolean;
  }

  interface NetworkInformation {
    effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
    downlink?: number;
    rtt?: number;
  }

  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }

  interface NodeJS {
    global?: {
      gc?: () => void;
    };
  }

  var gc: (() => void) | undefined;
}
