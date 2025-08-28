/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  // pridaj ďalšie env premenné podľa potreby
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
