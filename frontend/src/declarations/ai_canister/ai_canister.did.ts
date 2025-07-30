import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface Stats {
  'btc_address' : [] | [string],
  'btc_price' : bigint,
  'last_txid' : [] | [string],
  'threshold_pct' : bigint,
  'paused' : boolean,
}

export interface _SERVICE {
  'get_logs' : ActorMethod<[], Array<string>>,
  'get_stats' : ActorMethod<[], Stats>,
  'pause_ai' : ActorMethod<[boolean], boolean>,
  'send_demo_btc' : ActorMethod<[], string>,
  'set_strategy' : ActorMethod<[bigint], bigint>,
  'tick' : ActorMethod<[], undefined>,
}
