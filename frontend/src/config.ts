// Configuration for toggling between real and mock functionality
export const config = {
  // Set to true to use mock wallet/canister implementations, false for real ones
  useMockWallet: true,
  
  // Development settings
  isDevelopment: import.meta.env.DEV || true,
  
  // Canister IDs - these are used regardless of mock mode
  canisters: {
    aiCanisterId: import.meta.env.VITE_AI_CANISTER_ID || 'rrkah-fqaaa-aaaaa-aaaaq-cai',
    storeCanisterId: import.meta.env.VITE_STORE_CANISTER_ID || 'ryjl3-tyaaa-aaaaa-aaaba-cai'
  },
  
  // Internet Identity URL
  iiUrl: import.meta.env.VITE_II_URL || 'https://identity.ic0.app',
  
  // Local replica host
  host: import.meta.env.VITE_HOST || 'http://localhost:4943'
};

export default config;
