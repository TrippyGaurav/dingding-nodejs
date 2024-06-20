export interface Games {
  gameName: string;
  gameThumbnailUrl: string;
  gameHostLink: string;
  type: string;
  category: string;
  status: Boolean;
  tagName: string;
  payout: Payout[];
}

export interface Payout {
  gameName: string;

  data: object;
}
