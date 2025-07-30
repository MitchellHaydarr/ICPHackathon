export const idlFactory: ({ IDL }: { IDL: any }) => any;

export interface Stats {
  prediction_count: bigint;
  average_confidence: number;
  success_rate: number;
}

export interface _SERVICE {
  get_stats: () => Promise<Stats>;
}
