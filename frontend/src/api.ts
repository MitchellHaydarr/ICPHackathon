import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { idlFactory } from './declarations/store_canister/store_canister.did.js';

// Types for the store canister based on the Motoko implementation
export interface StoreCanisterActor {
  deposit: () => Promise<bigint>;
  withdraw: (amount: bigint) => Promise<bigint>;
  get_portfolio: (principal: Principal) => Promise<bigint>;
}

const HOST = import.meta.env.VITE_DFX_NETWORK === 'ic'
  ? 'https://ic0.app'
  : 'http://localhost:4943';

let agent: HttpAgent | undefined;
let storeCanisterActor: StoreCanisterActor | undefined;

// Initialize the agent and actor
export const initializeApi = async (canisterId: string) => {
  if (!agent) {
    agent = new HttpAgent({ host: HOST });
    
    // Only in development, fetch root key
    if (HOST.includes('localhost')) {
      await agent.fetchRootKey();
    }
  }

  storeCanisterActor = Actor.createActor<StoreCanisterActor>(
    idlFactory,
    {
      agent,
      canisterId,
    }
  );
};

// Get portfolio balance for a given principal
export const getPortfolio = async (principal: Principal): Promise<bigint> => {
  if (!storeCanisterActor) {
    throw new Error('API not initialized. Call initializeApi first.');
  }
  
  return storeCanisterActor.get_portfolio(principal);
};

// Deposit ICP (default 1 ICP)
export const deposit = async (): Promise<bigint> => {
  if (!storeCanisterActor) {
    throw new Error('API not initialized. Call initializeApi first.');
  }
  
  return storeCanisterActor.deposit();
};

// Withdraw ICP
export const withdraw = async (amount: bigint): Promise<bigint> => {
  if (!storeCanisterActor) {
    throw new Error('API not initialized. Call initializeApi first.');
  }
  
  return storeCanisterActor.withdraw(amount);
};

// Convert e8s to ICP for display
export const e8sToIcp = (e8s: bigint): number => {
  return Number(e8s) / 10_000_000;
};

// Convert ICP to e8s for transactions
export const icpToE8s = (icp: number): bigint => {
  return BigInt(Math.floor(icp * 10_000_000));
};
