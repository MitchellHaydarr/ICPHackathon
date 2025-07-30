import { Actor, HttpAgent, ActorSubclass } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';

// Import canister interfaces and services
import { idlFactory as aiCanisterIdl } from '../declarations/ai_canister';
import { idlFactory as storeCanisterIdl } from '../declarations/store_canister';
import { _SERVICE as AICanisterService } from '../declarations/ai_canister/ai_canister.did';
import { _SERVICE as StoreCanisterService } from '../declarations/store_canister/store_canister.did';

// Canister IDs must match with dfx.json
const AI_CANISTER_ID = import.meta.env.VITE_CANISTER_ID_AI_CANISTER || 'rrkah-fqaaa-aaaaa-aaaaq-cai';
const STORE_CANISTER_ID = import.meta.env.VITE_CANISTER_ID_STORE_CANISTER || 'ryjl3-tyaaa-aaaaa-aaaba-cai';

// Create an agent based on the current environment
const createAgent = () => {
  const isLocalEnv = import.meta.env.VITE_DFX_NETWORK !== 'ic';
  const host = isLocalEnv ? 'http://localhost:8000' : 'https://ic0.app';
  
  return new HttpAgent({ host });
};

// Create AI canister actor
export const getAICanister = (): ActorSubclass<AICanisterService> => {
  const agent = createAgent();
  
  // Only necessary for local development
  if (import.meta.env.VITE_DFX_NETWORK !== 'ic') {
    agent.fetchRootKey().catch(err => {
      console.warn('Unable to fetch root key. If working locally, make sure your local replica is running');
      console.error(err);
    });
  }
  
  return Actor.createActor<AICanisterService>(aiCanisterIdl, {
    agent,
    canisterId: AI_CANISTER_ID,
  });
};

// Create Store canister actor
export const getStoreCanister = (): ActorSubclass<StoreCanisterService> => {
  const agent = createAgent();
  
  // Only necessary for local development
  if (import.meta.env.VITE_DFX_NETWORK !== 'ic') {
    agent.fetchRootKey().catch(err => {
      console.warn('Unable to fetch root key. If working locally, make sure your local replica is running');
      console.error(err);
    });
  }
  
  return Actor.createActor<StoreCanisterService>(storeCanisterIdl, {
    agent,
    canisterId: STORE_CANISTER_ID,
  });
};

// Helper to format e8s to ICP
export const formatICP = (e8s: number | bigint): string => {
  const value = Number(e8s) / 100_000_000;
  return value.toFixed(8).replace(/\.?0+$/, '');
};

// Helper to format timestamp to readable date
export const formatDate = (timestamp: bigint): string => {
  return new Date(Number(timestamp) * 1000).toLocaleString();
};
