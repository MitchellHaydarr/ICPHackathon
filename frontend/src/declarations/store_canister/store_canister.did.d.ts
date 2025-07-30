import { Principal } from '@dfinity/principal';

export const idlFactory: ({ IDL }: { IDL: any }) => any;

export interface Result {
  'ok'?: bigint;
  'err'?: string;
}

export interface Asset {
  token: string;
  amount: bigint;
  value_usd: bigint;
}

export interface Portfolio {
  assets: Asset[];
  totalValue: bigint;
}

export interface _SERVICE {
  deposit: () => Promise<Result>;
  get_all_portfolios: () => Promise<Array<[Principal, bigint]>>;
  get_portfolio: (principal: Principal) => Promise<Portfolio>;
  runTests: () => Promise<string>;
  withdraw: (amount: bigint) => Promise<Result>;
}
