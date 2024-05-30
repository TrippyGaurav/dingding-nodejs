import { Server } from "http";

export let emitError: errorEmmitterClass | undefined;

export class errorEmmitterClass {
  socket: Server;
  constructor(socket: Server) {
    this.socket = socket;
  }

  Call(errorCode: string, message: string) {
    const errorDetails: ErrorDetails = {
      errorCode: errorCode,
      message: message,
    };
    this.socket.emit("InternalError", errorDetails);
  }
}

interface ErrorDetails {
  errorCode: string;
  message: string;
}

export function initializeErrorEmmiter(socket: Server) {
  emitError = new errorEmmitterClass(socket);
}
