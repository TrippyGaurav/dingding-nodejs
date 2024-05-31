export const clients: Map<string, WebSocket> = new Map();

export enum MESSAGEID {
  AUTH = "AUTH",
  SPIN = "SPIN",
  GAMBLE = "GAMBLE",
}

export const enum MESSAGETYPE {
  ALERT = "alert",
  MESSAGE = "message",
  ERROR = "internalError",
}
