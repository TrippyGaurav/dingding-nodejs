import { initializeUser } from "./userSocket";
import enterPlayer from "../playerSocket";


const socketController = (io) => {
  io.use((socket, next) => {
    console.log("I'm Socket middleware");
    next();
  });

  io.on("connection", (socket) => {
    io.emit("newConnectionAlert", "A new user has connected!");
    enterPlayer(socket);
  });
};

export default socketController;
