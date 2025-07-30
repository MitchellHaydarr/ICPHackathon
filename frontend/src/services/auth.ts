import { AuthClient } from '@dfinity/auth-client';
import { Actor, HttpAgent, Identity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';

// Default identity provider for Internet Identity
const II_URL = import.meta.env.VITE_II_URL || 'https://identity.ic0.app';
const MAX_TTL = BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000); // 7 days in nanoseconds

export interface AuthState {
  isAuthenticated: boolean;
  identity: Identity | null;
  principal: Principal | null;
}

export class AuthService {
  private static instance: AuthService;
  private authClient: AuthClient | null = null;
  private _identity: Identity | null = null;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async initialize(): Promise<AuthState> {
    try {
      this.authClient = await AuthClient.create();
      const isAuthenticated = await this.authClient.isAuthenticated();
      
      if (isAuthenticated) {
        this._identity = this.authClient.getIdentity();
        return {
          isAuthenticated: true,
          identity: this._identity,
          principal: this._identity.getPrincipal()
        };
      }

      return {
        isAuthenticated: false,
        identity: null,
        principal: null
      };
    } catch (error) {
      console.error('Error initializing AuthClient:', error);
      return {
        isAuthenticated: false,
        identity: null,
        principal: null
      };
    }
  }

  async login(): Promise<AuthState> {
    if (!this.authClient) {
      await this.initialize();
    }

    if (!this.authClient) {
      throw new Error('AuthClient not initialized');
    }

    return new Promise((resolve, reject) => {
      this.authClient!.login({
        identityProvider: II_URL,
        maxTimeToLive: MAX_TTL,
        onSuccess: () => {
          this._identity = this.authClient!.getIdentity();
          resolve({
            isAuthenticated: true,
            identity: this._identity,
            principal: this._identity.getPrincipal()
          });
        },
        onError: (error) => {
          console.error('Login failed:', error);
          reject(new Error(`Login failed: ${error}`));
        }
      });
    });
  }

  async logout(): Promise<void> {
    if (!this.authClient) {
      return;
    }
    
    await this.authClient.logout();
    this._identity = null;
  }

  getIdentity(): Identity | null {
    return this._identity;
  }

  getPrincipal(): Principal | null {
    return this._identity ? this._identity.getPrincipal() : null;
  }

  isAuthenticated(): boolean {
    return this._identity !== null;
  }

  // Create an HttpAgent with the current identity
  createAgent(): HttpAgent {
    const agent = new HttpAgent({
      identity: this._identity || undefined,
      host: import.meta.env.VITE_IC_HOST || 'https://ic0.app'
    });
    
    if (import.meta.env.DEV) {
      // When in development mode, we need to explicitly fetch the root key
      agent.fetchRootKey().catch(err => {
        console.warn('Unable to fetch root key. Check your local replica is running');
        console.error(err);
      });
    }
    
    return agent;
  }
}

export const authService = AuthService.getInstance();
