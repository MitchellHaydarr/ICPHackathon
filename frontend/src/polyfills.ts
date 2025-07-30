/**
 * Internet Computer SDK Polyfills for Browser Environment
 * 
 * This file provides polyfills for Node.js globals needed by Internet Computer SDK
 * when running in a browser environment. These polyfills allow the agent-js libraries
 * to function properly in the browser.
 */

// Only apply polyfills in browser environment
if (typeof window !== 'undefined') {
  // 1. Global object polyfill
  if (typeof window.global === 'undefined') {
    // @ts-ignore - Make window the global object
    window.global = window;
  }

  // 2. Process object polyfill 
  if (typeof window.process === 'undefined') {
    // Create a minimal process object with required properties
    const processPolyfill = {
      // Basic environment variables needed by some libraries
      env: {
        NODE_ENV: 'development',
        PUBLIC_URL: ''
      },
      // Common process properties used by various libraries
      browser: true,
      version: '1.0.0',
      versions: {},
      nextTick: function(callback: Function) {
        setTimeout(callback, 0);
      }
    };
    
    // @ts-ignore - Apply the process polyfill
    window.process = processPolyfill;
  }

  // 3. Buffer polyfill
  // Let vite-plugin-node-polyfills handle the actual Buffer implementation
  // Just provide a minimal fallback to prevent errors if that fails
  if (typeof window.Buffer === 'undefined') {
    try {
      // Create a minimal Buffer-like object
      // Since we can't properly implement the full Buffer interface,
      // we'll use a complete @ts-ignore for the entire window.Buffer assignment
      // @ts-ignore - Complete override of type checking for Buffer
      window.Buffer = window.Buffer || {};
      
      // Only add isBuffer if it doesn't exist
      if (!window.Buffer.isBuffer) {
        // @ts-ignore
        window.Buffer.isBuffer = function(obj: any): obj is Buffer { return false; };
      }
    } catch (e) {
      console.warn('Failed to create Buffer polyfill:', e);
    }
  }
}

export {};
