const socketMiddleware = (socket, next) => {
  console.log(`Socket middleware triggered for socket ID: ${socket.id}`);

  next();
};

export default socketMiddleware;
