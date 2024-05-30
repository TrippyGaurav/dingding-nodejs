export const clients: Map<string, WebSocket> = new Map();

export enum MESSAGEID {
  AUTH = "AUTH",
  SPIN = "SPIN",
  GAMBLE = "GAMBLE",
}
