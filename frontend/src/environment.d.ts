/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CANISTER_ID_AI_CANISTER: string;
  readonly VITE_CANISTER_ID_STORE_CANISTER: string;
  readonly VITE_DFX_NETWORK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
