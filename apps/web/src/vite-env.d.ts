/// <reference types="vite/client" />
/* eslint-disable @typescript-eslint/no-unused-vars, no-var */

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
  var _alert: (_message?: any) => void;
  var _setTimeout: (_callback: (..._args: any[]) => void, _ms: number, ..._args: any[]) => number;
  var _clearTimeout: (_id: number) => void;
  var _setInterval: (_callback: (..._args: any[]) => void, _ms: number, ..._args: any[]) => number;
  var _clearInterval: (_id: number) => void;
  var _window: any;
  var _navigator: any;
  var _caches: any;
  var _performance: any;
  var _console: any;
  
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
    addEventListener(_type: string, _listener: EventListenerOrEventListenerObject): void;
    removeEventListener(_type: string, _listener: EventListenerOrEventListenerObject): void;
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface _CustomEvent<T = any> extends Event {
    readonly detail: T;
  }
  
  // Message Event
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface _MessageEvent<T = any> extends Event {
    readonly data: T;
    readonly origin: string;
    readonly lastEventId: string;
    readonly source: any | null;
    readonly ports: ReadonlyArray<MessagePort>;
  }
  
  // Service Worker types
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface _ServiceWorkerRegistration {
    readonly scope: string;
    readonly installing: any | null;
    readonly waiting: any | null;
    readonly active: any | null;
    addEventListener(_type: string, _listener: EventListenerOrEventListenerObject): void;
    removeEventListener(_type: string, _listener: EventListenerOrEventListenerObject): void;
    update(): Promise<void>;
    unregister(): Promise<boolean>;
  }
  
  // Push notification types
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type _NotificationPermission = 'default' | 'granted' | 'denied';
  
  interface Notification extends EventTarget {
    readonly title: string;
    readonly body: string;
    readonly icon: string;
    readonly badge: string;
    readonly tag: string;
    readonly data: any;
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
    new(_title: string, _options?: any): Notification;
  }
  
  // eslint-disable-next-line no-var, @typescript-eslint/no-unused-vars
  var Notification: NotificationConstructor;
  
  // Push subscription types
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Cache {
    add(_request: any): Promise<void>;
    addAll(_requests: any[]): Promise<void>;
    delete(_request: any, _options?: CacheQueryOptions): Promise<boolean>;
    keys(_request?: any, _options?: CacheQueryOptions): Promise<ReadonlyArray<any>>;
    match(_request: any, _options?: CacheQueryOptions): Promise<any | undefined>;
    matchAll(_request?: any, _options?: CacheQueryOptions): Promise<ReadonlyArray<any>>;
    put(_request: any, _response: any): Promise<void>;
  }
  
  interface CacheQueryOptions {
    ignoreMethod?: boolean;
    ignoreSearch?: boolean;
    ignoreVary?: boolean;
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface _CacheStorage {
    delete(_cacheName: string): Promise<boolean>;
    has(_cacheName: string): Promise<boolean>;
    keys(): Promise<ReadonlyArray<string>>;
    match(_request: any, _options?: MultiCacheQueryOptions): Promise<any | undefined>;
    open(_cacheName: string): Promise<Cache>;
  }
  
  interface MultiCacheQueryOptions extends CacheQueryOptions {
    cacheName?: string;
  }
  
  // Message Channel types
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface MessageChannel {
    readonly port1: MessagePort;
    readonly port2: MessagePort;
  }
  
  interface MessageChannelConstructor {
    new(): MessageChannel;
  }
  
  // eslint-disable-next-line no-var
  var MessageChannel: MessageChannelConstructor;
  
  interface MessagePort extends EventTarget {
    postMessage(_message: any, _transfer?: any[]): void;
    start(): void;
    close(): void;
    addEventListener(_type: string, _listener: EventListenerOrEventListenerObject): void;
    removeEventListener(_type: string, _listener: EventListenerOrEventListenerObject): void;
  }
  
  // URL Search Params
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface URLSearchParams {
    append(_name: string, _value: string): void;
    delete(_name: string): void;
    get(_name: string): string | null;
    getAll(_name: string): string[];
    has(_name: string): boolean;
    set(_name: string, _value: string): void;
    sort(): void;
    toString(): string;
    forEach(_callbackfn: (_value: string, _key: string, _parent: URLSearchParams) => void, _thisArg?: any): void;
  }
  
  interface URLSearchParamsConstructor {
    new(_init?: string | string[][] | Record<string, string> | URLSearchParams): URLSearchParams;
  }
  
  // eslint-disable-next-line no-var
  var URLSearchParams: URLSearchParamsConstructor;
  
  // Image constructor
  interface ImageConstructor {
    new(_width?: number, _height?: number): HTMLImageElement;
  }
  
  // eslint-disable-next-line no-var
  var _Image: ImageConstructor;
  
  // Blob constructor
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Blob {
    size: number;
    type: string;
    slice(_start?: number, _end?: number, _contentType?: string): Blob;
  }
  
  interface BlobConstructor {
    new(_blobParts?: BlobPart[], _options?: any): Blob;
  }
  
  // eslint-disable-next-line no-var
  var Blob: BlobConstructor;
  
  type BlobPart = BufferSource | Blob | string;
  type BufferSource = ArrayBufferView | ArrayBuffer;
  
  // FormData constructor
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface FormData {
    append(_name: string, _value: string | Blob, _fileName?: string): void;
    delete(_name: string): void;
    get(_name: string): FormDataEntryValue | null;
    getAll(_name: string): FormDataEntryValue[];
    has(_name: string): boolean;
    set(_name: string, _value: string | Blob, _fileName?: string): void;
  }
  
  interface FormDataConstructor {
    new(_form?: HTMLFormElement): FormData;
  }
  
  // eslint-disable-next-line no-var
  var FormData: FormDataConstructor;
  
  type FormDataEntryValue = File | string;
  
  // HTML Element types
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    setRangeText(_replacement: string, _start?: number, _end?: number, _selectionMode?: SelectionMode): void;
    addEventListener(_type: string, _listener: EventListenerOrEventListenerObject): void;
    removeEventListener(_type: string, _listener: EventListenerOrEventListenerObject): void;
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface _HTMLDivElement {
    addEventListener(_type: string, _listener: EventListenerOrEventListenerObject): void;
    removeEventListener(_type: string, _listener: EventListenerOrEventListenerObject): void;
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface _HTMLButtonElement {
    disabled: boolean;
    type: string;
    value: string;
    form: HTMLFormElement | null;
    addEventListener(_type: string, _listener: EventListenerOrEventListenerObject): void;
    removeEventListener(_type: string, _listener: EventListenerOrEventListenerObject): void;
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLFormElement {
    elements: HTMLFormControlsCollection;
    addEventListener(_type: string, _listener: EventListenerOrEventListenerObject): void;
    removeEventListener(_type: string, _listener: EventListenerOrEventListenerObject): void;
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface _HTMLSpanElement {
    addEventListener(_type: string, _listener: EventListenerOrEventListenerObject): void;
    removeEventListener(_type: string, _listener: EventListenerOrEventListenerObject): void;
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLImageElement {
    src: string;
    width: number;
    height: number;
    alt: string;
    addEventListener(_type: string, _listener: EventListenerOrEventListenerObject): void;
    removeEventListener(_type: string, _listener: EventListenerOrEventListenerObject): void;
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLFormControlsCollection {
    [index: number]: Element;
    length: number;
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Element {
    addEventListener(_type: string, _listener: EventListenerOrEventListenerObject): void;
    removeEventListener(_type: string, _listener: EventListenerOrEventListenerObject): void;
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface File {
    name: string;
    size: number;
    type: string;
    lastModified: number;
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type SelectionMode = 'select' | 'start' | 'end' | 'preserve';
}