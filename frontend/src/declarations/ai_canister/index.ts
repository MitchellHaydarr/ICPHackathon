import { Actor, HttpAgent } from "@dfinity/agent";

// Imports and re-exports candid interface
import { idlFactory } from './ai_canister.did.js';
export { idlFactory } from './ai_canister.did.js';

// CANISTER_ID is replaced by webpack based on node environment
export const canisterId = import.meta.env.VITE_CANISTER_ID_AI_CANISTER || 'rrkah-fqaaa-aaaaa-aaaaq-cai';

interface ActorOptions {
  agent?: HttpAgent;
  agentOptions?: Record<string, unknown>;
  actorOptions?: Record<string, unknown>;
}

export const createActor = (canisterId: string, options: ActorOptions = {}) => {
  const agent = options.agent || new HttpAgent({ ...(options.agentOptions || {}) });

  if (options.agent && options.agentOptions) {
    console.warn(
      "Detected both agent and agentOptions passed to createActor. Ignoring agentOptions and proceeding with the provided agent."
    );
  }

  // Creates an actor with using the candid interface and the HttpAgent
  return Actor.createActor(idlFactory, {
    agent,
    canisterId,
    ...(options.actorOptions || {}),
  });
};

export const ai_canister = createActor(canisterId);
