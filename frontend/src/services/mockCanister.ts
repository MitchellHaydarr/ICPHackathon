import { ActorMethod, ActorSubclass, Actor } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import type { _SERVICE as AICanisterService } from '../declarations/ai_canister/ai_canister.did';
import type { _SERVICE as StoreCanisterService } from '../declarations/store_canister/store_canister.did';
import type { Stats } from '../declarations/ai_canister/ai_canister.did';
import { PortfolioAsset, PortfolioData } from './canister';

// Helper to create mock ActorMethod functions that match the required interface
function createActorMethod<T extends any[], R>(fn: (...args: T) => Promise<R>): ActorMethod<T, R> {
  const method = ((...args: T) => fn(...args)) as ActorMethod<T, R>;
  method.withOptions = (options: any) => method;
  return method;
}

// Define metadata symbol for Actor interface compatibility
const metadataSymbol = Symbol.for('ic-agent-metadata');

// Create a wrapper function that creates a proper Actor-compatible object
function createActorWrapper<T>(implementation: any, canisterId: Principal): ActorSubclass<T> {
  // Start with a base object
  const base = {
    getCanisterId: () => canisterId
  };
  
  // Cast to unknown first to avoid TypeScript's type checking
  const actorObject = base as unknown as Actor;
  
  // Add metadata symbol
  (actorObject as any)[metadataSymbol] = { canisterId };

  // Merge the implementation methods with the actor object
  return Object.assign(actorObject, implementation) as ActorSubclass<T>;
}

// Mock AI Canister implementation - this is just the implementation without Actor interface
export class MockAICanisterImpl {
  private canisterId = Principal.fromText('rrkah-fqaaa-aaaaa-aaaaq-cai');
  private _paused = false;
  private _threshold = BigInt(5);
  
  getCanisterId(): Principal {
    return this.canisterId;
  }

  // ActorMethod implementations
  get_stats = createActorMethod<[], Stats>(async () => {
    console.log('Mock AI Canister: get_stats called');
    // Return mock data with current state
    return {
      btc_address: ['bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'],
      btc_price: BigInt(53000), // Mock BTC price
      last_txid: ['f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16'],
      threshold_pct: this._threshold,
      paused: this._paused
    };
  });

  get_logs = createActorMethod<[], string[]>(async () => {
    console.log('Mock AI Canister: get_logs called');
    
    // Generate dynamic logs based on current time and state
    const now = new Date();
    const timeStr = now.toISOString();
    const minutesAgo10 = new Date(now.getTime() - 10 * 60000).toISOString();
    const minutesAgo20 = new Date(now.getTime() - 20 * 60000).toISOString();
    
    return [
      `${minutesAgo20.substring(0, 19)}Z - System initialized`,
      `${minutesAgo10.substring(0, 19)}Z - BTC price updated: 53000`,
      `${timeStr.substring(0, 19)}Z - AI Status: ${this._paused ? 'Paused' : 'Active'}, Threshold: ${this._threshold}%`
    ];
  });

  pause_ai = createActorMethod<[boolean], boolean>(async (paused) => {
    console.log(`Mock AI Canister: pause_ai called with value ${paused}`);
    this._paused = paused;
    return paused;
  });

  send_demo_btc = createActorMethod<[], string>(async () => {
    console.log('Mock AI Canister: send_demo_btc called');
    return 'f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16';
  });

  set_strategy = createActorMethod<[bigint], bigint>(async (threshold) => {
    console.log(`Mock AI Canister: set_strategy called with threshold ${threshold}`);
    this._threshold = threshold;
    return threshold;
  });

  tick = createActorMethod<[], undefined>(async () => {
    console.log('Mock AI Canister: tick called');
    return undefined;
  });
}

// Mock Store Canister implementation - just the implementation without Actor interface
export class MockStoreCanisterImpl {
  private canisterId = Principal.fromText('rdmx6-jaaaa-aaaaa-aaadq-cai');
  private portfolioData: Map<string, PortfolioData> = new Map();
  
  getCanisterId(): Principal {
    return this.canisterId;
  }

  constructor() {
    // Initialize with sample data for different tokens
    this.portfolioData.set('default', {
      assets: [
        { token: 'ICP', amount: BigInt(10000000000), value: BigInt(200000000000) },
        { token: 'BTC', amount: BigInt(5000000), value: BigInt(265000000000) },
        { token: 'ETH', amount: BigInt(30000000), value: BigInt(90000000000) },
        { token: 'SOL', amount: BigInt(150000000), value: BigInt(45000000000) }
      ],
      totalValue: BigInt(600000000000)
    });
  }

  // Using the ActorMethod creator helper - fix types to match expected interfaces
  get_portfolio = createActorMethod<[Principal], PortfolioData>(async (principal?) => {
    console.log('Mock Store Canister: get_portfolio called with principal:', principal?.toString());
    return this.portfolioData.get('default') || {
      assets: [],
      totalValue: BigInt(0)
    };
  });

  deposit = createActorMethod<[], boolean>(async () => {
    console.log('Mock Store Canister: deposit called (simulating ICP deposit)');
    // Update portfolio data with a simulated ICP deposit
    const portfolio = this.portfolioData.get('default');
    const token = 'ICP';
    const amount = BigInt(1_00000000); // 1 ICP in e8s
    
    if (portfolio) {
      const assetIndex = portfolio.assets.findIndex(asset => asset.token === token);
      if (assetIndex >= 0) {
        portfolio.assets[assetIndex].amount += amount;
        portfolio.assets[assetIndex].value += (amount * BigInt(20)); // Simulate value calculation
        portfolio.totalValue += (amount * BigInt(20));
      } else {
        portfolio.assets.push({
          token,
          amount,
          value: amount * BigInt(20) // Simple conversion for demo
        });
        portfolio.totalValue += (amount * BigInt(20));
      }
    }
    return true;
  });

  withdraw = createActorMethod<[bigint], boolean>(async (amount) => {
    console.log(`Mock Store Canister: withdraw called with amount ${amount}`);
    // Update portfolio data for demonstration (assume ICP withdrawal)
    const portfolio = this.portfolioData.get('default');
    const token = 'ICP';
    
    if (portfolio) {
      const assetIndex = portfolio.assets.findIndex(asset => asset.token === token);
      if (assetIndex >= 0 && portfolio.assets[assetIndex].amount >= amount) {
        portfolio.assets[assetIndex].amount -= amount;
        const valueReduction = (amount * BigInt(20));
        portfolio.assets[assetIndex].value -= valueReduction;
        portfolio.totalValue -= valueReduction;
        
        // Remove asset if amount is zero
        if (portfolio.assets[assetIndex].amount === BigInt(0)) {
          portfolio.assets.splice(assetIndex, 1);
        }
      }
    }
    return true;
  });
}

// Export factory functions to create mock canisters
export const getAIMockCanister = (): ActorSubclass<AICanisterService> => {
  const implementation = new MockAICanisterImpl();
  return createActorWrapper<AICanisterService>(
    implementation, 
    implementation.getCanisterId()
  );
};

export const getStoreMockCanister = (): ActorSubclass<StoreCanisterService> => {
  const implementation = new MockStoreCanisterImpl();
  return createActorWrapper<StoreCanisterService>(
    implementation, 
    implementation.getCanisterId()
  );
};
