export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({
    'ok' : IDL.Nat,
    'err' : IDL.Text,
  });
  return IDL.Service({
    'deposit' : IDL.Func([], [Result], []),
    'get_all_portfolios' : IDL.Func([], [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat))], ['query']),
    'get_portfolio' : IDL.Func([IDL.Principal], [IDL.Nat], ['query']),
    'runTests' : IDL.Func([], [IDL.Text], []),
    'withdraw' : IDL.Func([IDL.Nat], [Result], []),
  });
};
