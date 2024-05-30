const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log("A user connected");

    io.emit("newConnectionAlert", "A new user has connected!");

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });
};

export default socketHandler;
