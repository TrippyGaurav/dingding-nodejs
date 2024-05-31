// import { Server } from "http";

// export let gameEmiter: MyEmmiter | undefined;

// export class MyEmmiter {
//   socket: Server;
//   constructor(socket: Server) {
//     this.socket = socket;
//   }

//   sendError(errorCode: string, message: any) {
//     const messageParams = {
//       errorCode: errorCode,
//       message: message,
//     };
//     this.socket.emit(MESSAGETYPE.ERROR, messageParams);
//   }

//   sendAlert(message: string) {
//     this.socket.emit(MESSAGETYPE.ALERT, message);
//   }

//   sendMessage(id: string, message: any) {
//     this.socket.emit(MESSAGETYPE.MESSAGE, { id, message });
//   }
// }

const enum MESSAGETYPE {
  ALERT = "Alert",
  MESSAGE = "Message",
  ERROR = "InternalError",
}
interface ErrorDetails {
  errorCode: string;
  message: string;
}
// interface Alerts {
//   I;
// }

// export function initializeErrorEmmiter(socket: Server) {
//   gameEmiter = new MyEmmiter(socket);
// }
