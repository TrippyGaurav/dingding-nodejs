import {
  MyEmmiter,
  gameEmiter,
  initializeErrorEmmiter,
} from "../utils/gameEmmiter";

const socketMiddleware = (socket, next) => {
  initializeErrorEmmiter(socket);
  console.log(`Socket middleware triggered for socket ID: ${socket.id}`);
  // emitError.CallError("101", "hello");
  next();
};

export default socketMiddleware;
