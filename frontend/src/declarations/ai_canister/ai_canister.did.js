export const idlFactory = ({ IDL }) => {
  const Stats = IDL.Record({
    'btc_address' : IDL.Opt(IDL.Text),
    'btc_price' : IDL.Nat64,
    'last_txid' : IDL.Opt(IDL.Text),
    'threshold_pct' : IDL.Nat64,
    'paused' : IDL.Bool,
  });
  return IDL.Service({
    'get_logs' : IDL.Func([], [IDL.Vec(IDL.Text)], ['query']),
    'get_stats' : IDL.Func([], [Stats], ['query']),
    'pause_ai' : IDL.Func([IDL.Bool], [IDL.Bool], []),
    'send_demo_btc' : IDL.Func([], [IDL.Text], []),
    'set_strategy' : IDL.Func([IDL.Nat64], [IDL.Nat64], []),
    'tick' : IDL.Func([], [], []),
  });
};
