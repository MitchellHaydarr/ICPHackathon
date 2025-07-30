import { Identity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { HttpAgent } from '@dfinity/agent';

// Mock Identity implementation that includes all required interface methods
class MockIdentity implements Identity {
  private _principal: Principal;

  constructor(principalId: string = '2vxsx-fae') {
    this._principal = Principal.fromText(principalId);
  }

  getPrincipal(): Principal {
    return this._principal;
  }

  getPublicKey(): Uint8Array {
    // Return a dummy public key
    return new Uint8Array([0, 1, 2, 3, 4, 5]);
  }

  async sign(): Promise<Uint8Array> {
    // Return a dummy signature
    return new Uint8Array([0, 1, 2, 3, 4, 5]);
  }
  
  // Additional required method from Identity interface
  transformRequest(request: Parameters<Identity['transformRequest']>[0]): Promise<Parameters<Identity['transformRequest']>[0]> {
    // Simple implementation that just returns the request unchanged
    return Promise.resolve(request);
  }
}

export interface AuthState {
  isAuthenticated: boolean;
  identity: Identity | null;
  principal: Principal | null;
}

export class MockAuthService {
  private static instance: MockAuthService;
  private _identity: MockIdentity | null = null;
  private _isAuthenticated: boolean = false;

  private constructor() {}

  public static getInstance(): MockAuthService {
    if (!MockAuthService.instance) {
      MockAuthService.instance = new MockAuthService();
    }
    return MockAuthService.instance;
  }

  async initialize(): Promise<AuthState> {
    console.log('[MockAuth] Initializing mock auth service');
    
    // For convenience in development, auto-login if configured to do so
    const autoLogin = true; // Set to false if you want to test the manual login flow
    
    if (autoLogin && !this._isAuthenticated) {
      console.log('[MockAuth] Auto-login enabled, creating mock session');
      return this.login();
    }
    
    console.log('[MockAuth] Returning current auth state:', 
      this._isAuthenticated ? 'authenticated' : 'not authenticated');
    
    return {
      isAuthenticated: this._isAuthenticated,
      identity: this._identity,
      principal: this._identity?.getPrincipal() || null
    };
  }

  async login(): Promise<AuthState> {
    try {
      console.log('[MockAuth] Login called - simulating Internet Identity authentication');
      this._identity = new MockIdentity('rrkah-fqaaa-aaaaa-aaaaq-cai');
      this._isAuthenticated = true;
      const principal = this._identity.getPrincipal();
      console.log('[MockAuth] Mock login successful');
      console.log('[MockAuth] Using mock principal:', principal.toString());
      console.log('[MockAuth] This is a simulated wallet - no real ICP transactions will occur');

      return {
        isAuthenticated: true,
        identity: this._identity,
        principal
      };
    } catch (err) {
      console.error('[MockAuth] Mock login failed:', err);
      return {
        isAuthenticated: false,
        identity: null,
        principal: null
      };
    }
  }

  async logout(): Promise<AuthState> {
    this._identity = null;
    this._isAuthenticated = false;

    console.log('Mock wallet disconnected!');

    return {
      isAuthenticated: false,
      identity: null,
      principal: null
    };
  }

  createAgent(): HttpAgent {
    // Create a mock agent with the mock identity
    const host = 'http://localhost:4943';
    const agent = new HttpAgent({ host });
    
    if (this._identity) {
      agent.replaceIdentity(this._identity);
    }
    
    // Disable certificate verification for local development
    agent.fetchRootKey().catch(err => {
      console.warn('Unable to fetch root key. Check your local replica is running');
      console.error(err);
    });

    return agent;
  }
}

// Export singleton instance
export const mockAuthService = MockAuthService.getInstance();
