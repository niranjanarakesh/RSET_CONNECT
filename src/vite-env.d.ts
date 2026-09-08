/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REXA_PORTAL_URL?: string;
  readonly VITE_COLLEGE_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
