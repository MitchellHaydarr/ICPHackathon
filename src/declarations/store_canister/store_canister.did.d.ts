import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type Result = { 'ok' : bigint } |
  { 'err' : string };
export interface _SERVICE {
  'deposit' : ActorMethod<[], Result>,
  'get_all_portfolios' : ActorMethod<[], Array<[Principal, bigint]>>,
  'get_portfolio' : ActorMethod<[Principal], bigint>,
  'runTests' : ActorMethod<[], string>,
  'withdraw' : ActorMethod<[bigint], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
