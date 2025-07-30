import { Actor, ActorSubclass, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { idlFactory as aiCanisterIDL } from '../declarations/ai_canister';
import { idlFactory as storeCanisterIDL } from '../declarations/store_canister';
import type { _SERVICE as AICanisterService } from '../declarations/ai_canister/ai_canister.did';
import type { _SERVICE as StoreCanisterService } from '../declarations/store_canister/store_canister.did';
import { authService } from './auth';
import { mockAuthService } from './mockAuth';
import { getAIMockCanister, getStoreMockCanister } from './mockCanister';
import config from '../config';

const AI_CANISTER_ID = config.canisters.aiCanisterId;
const STORE_CANISTER_ID = config.canisters.storeCanisterId;

// Format ICP values from e8s (100 million e8s = 1 ICP)
export const formatICP = (e8s: number | bigint): string => {
  const value = typeof e8s === 'bigint' ? Number(e8s) : e8s;
  return (value / 100_000_000).toFixed(2);
};

// Format timestamp to readable date
export const formatTimestamp = (timestamp: bigint): string => {
  const milliseconds = Number(timestamp) / 1_000_000;
  return new Date(milliseconds).toLocaleString();
};

// Get AI canister with current user identity - real or mock based on config
export const getAICanister = (): ActorSubclass<AICanisterService> => {
  if (config.useMockWallet) {
    console.log('Using Mock AI Canister');
    return getAIMockCanister();
  }
  
  const agent = authService.createAgent();
  return Actor.createActor<AICanisterService>(aiCanisterIDL, {
    agent,
    canisterId: AI_CANISTER_ID,
  });
};

// Get Store canister with current user identity - real or mock based on config
export const getStoreCanister = (): ActorSubclass<StoreCanisterService> => {
  if (config.useMockWallet) {
    console.log('Using Mock Store Canister');
    return getStoreMockCanister();
  }
  
  const agent = authService.createAgent();
  return Actor.createActor<StoreCanisterService>(storeCanisterIDL, {
    agent,
    canisterId: STORE_CANISTER_ID,
  });
};

// Error handling wrapper for canister calls
export const callCanister = async <T>(
  fn: () => Promise<T>,
  errorMessage = 'Error calling canister'
): Promise<{ success: boolean; data?: T; error?: string }> => {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error: any) {
    console.error(`${errorMessage}:`, error);
    const errorMsg = error.message || String(error);
    return { 
      success: false, 
      error: errorMsg.includes('Reject code:') 
        ? `Operation rejected by canister: ${errorMsg}`
        : `${errorMessage}: ${errorMsg}`
    };
  }
};

// Portfolio data interface
export interface PortfolioAsset {
  token: string;
  amount: bigint;
  value: bigint; // Value in USD (e8s)
}

export interface PortfolioData {
  assets: PortfolioAsset[];
  totalValue: bigint;
}

// Fetch user portfolio data
export const fetchPortfolio = async (principalId?: string): Promise<{ 
  success: boolean; 
  data?: PortfolioData; 
  error?: string 
}> => {
  try {
    const storeCanister = getStoreCanister();
    
    // Use provided principal or get current user's principal
    const principal = principalId 
      ? Principal.fromText(principalId)
      : authService.getPrincipal();
    
    if (!principal) {
      return { 
        success: false, 
        error: 'Not authenticated. Please connect to Internet Computer.' 
      };
    }
    
    // Get user's portfolio from canister
    const result = await storeCanister.get_portfolio(principal);
    
    // Transform canister data into more usable format with proper type handling
    let assets: PortfolioAsset[] = [];
    let totalValue = BigInt(0);
    
    try {
      // Handle different response formats between mock and real canisters
      // Safely cast the result to a type we can work with
      type PortfolioResult = { 
        assets: Array<{token?: string, amount?: bigint | number, value?: bigint | number, value_usd?: bigint | number}>
      };
      
      // Explicit type assertion
      const portfolioResult = result as unknown as PortfolioResult;
      
      if (portfolioResult && portfolioResult.assets && Array.isArray(portfolioResult.assets)) {
        // Process each asset with careful type handling
        assets = portfolioResult.assets.map((asset: any) => ({
          token: String(asset.token || ''),
          amount: BigInt(asset.amount || 0),
          value: BigInt(asset.value || asset.value_usd || 0)
        }));
        
        // Calculate total value - safely handling BigInt operations
        totalValue = assets.reduce(
          (sum, asset) => sum + asset.value, 
          BigInt(0)
        );
      }
    } catch (conversionError) {
      console.error('Error converting portfolio data types:', conversionError);
      throw new Error('Cannot mix BigInt and other types, use explicit conversions');
    }
    
    return {
      success: true,
      data: {
        assets,
        totalValue
      }
    };
  } catch (error: any) {
    console.error('Error fetching portfolio:', error);
    return {
      success: false,
      error: `Failed to fetch portfolio: ${error.message || String(error)}`
    };
  }
};

// Deposit funds to portfolio
export const depositFunds = async (
  token: string, 
  amount: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!config.useMockWallet && !authService.isAuthenticated()) {
      return { 
        success: false, 
        error: 'Not authenticated. Please connect to Internet Computer.' 
      };
    }
    
    const storeCanister = getStoreCanister();
    
    // Convert to e8s (100 million e8s = 1 ICP/BTC/etc)
    const amountE8s = BigInt(Math.floor(amount * 100_000_000));
    
    // Call deposit method (no parameters in interface)
    console.log(`Depositing ${amount} ${token} (simulated)`);
    await storeCanister.deposit();
    
    return { success: true };
  } catch (error: any) {
    console.error('Error depositing funds:', error);
    return {
      success: false,
      error: `Failed to deposit: ${error.message || String(error)}`
    };
  }
};

// Withdraw funds from portfolio
export const withdrawFunds = async (
  token: string, 
  amount: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!config.useMockWallet && !authService.isAuthenticated()) {
      return { 
        success: false, 
        error: 'Not authenticated. Please connect to Internet Computer.' 
      };
    }
    
    const storeCanister = getStoreCanister();
    
    // Convert to e8s (100 million e8s = 1 ICP/BTC/etc)
    const amountE8s = BigInt(Math.floor(amount * 100_000_000));
    
    // Call withdraw method with amount parameter
    console.log(`Withdrawing ${amount} ${token} (simulated)`);
    await storeCanister.withdraw(amountE8s);
    
    return { success: true };
  } catch (error: any) {
    console.error('Error withdrawing funds:', error);
    return {
      success: false,
      error: `Failed to withdraw: ${error.message || String(error)}`
    };
  }
};
