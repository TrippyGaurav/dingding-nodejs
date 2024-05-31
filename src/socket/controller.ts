import { v4 as uuidv4 } from "uuid";
import { clients } from "../utils/utils";

import { User, initializeUser } from "../user/user";

const socketController = (io) => {
  io.on("connection", (socket) => {
    io.emit("newConnectionAlert", "A new user has connected!");
    initializeUser(socket);
  });
};

export default socketController;
