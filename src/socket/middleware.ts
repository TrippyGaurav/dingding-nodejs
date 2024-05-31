const socketMiddleware = (socket, next) => {
  console.log(`Socket middleware triggered for socket ID: ${socket.id}`);
  // emitError.CallError("101", "hello");
  next();
};

export default socketMiddleware;
