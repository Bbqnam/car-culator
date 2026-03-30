/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CARAI_CHAT_API_URL?: string;
  readonly VITE_GROK_CHAT_API_URL?: string;
  readonly VITE_XAI_BROWSER_API_URL?: string;
  readonly VITE_XAI_MODEL?: string;
  readonly VITE_OLLAMA_CHAT_API_URL?: string;
  readonly VITE_OLLAMA_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
