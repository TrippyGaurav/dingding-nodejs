import { emitError, initializeErrorEmmiter } from "../utils/erroremmiter";

const socketMiddleware = (socket, next) => {
  initializeErrorEmmiter(socket);
  console.log(`Socket middleware triggered for socket ID: ${socket.id}`);
  emitError.Call("101", "BHAG JAA");
  next();
};

export default socketMiddleware;
