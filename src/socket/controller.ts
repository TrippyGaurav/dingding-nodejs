import { v4 as uuidv4 } from "uuid";
import { clients } from "../utils/utils";
import { messageHandler } from "./handler";
import { gameEmiter, initializeErrorEmmiter } from "../utils/gameEmmiter";

const socketController = (io) => {
  io.on("connection", (socket) => {
    io.emit("newConnectionAlert", "A new user has connected!");

    let isAlive = true;
    clients.set(socket.id, socket);

    // Function to handle pong messages
    function heartbeat() {
      isAlive = true;
    }

    // // Set up a ping interval for the client
    // const pingInterval = setInterval(() => {
    //   if (isAlive === false) {
    //     // If the client did not respond to the last ping, consider it disconnected
    //     console.log(
    //       `Client ${clientId} not responding, terminating connection`
    //     );
    //     socket.terminate();
    //     clearInterval(pingInterval);
    //     // Remove the client from the map
    //     clients.delete(clientId);
    //   } else {
    //     isAlive = false;
    //     socket.ping();
    //   }
    // }, 5000); // Ping every 5 seconds

    socket.on("pong", heartbeat);

    socket.on("message", messageHandler(socket, socket.id));

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });

    // Error handling
    // socket.on("error", (err) => {
    //   console.error("Socket error: ", err.message);
    //   socket.emit("errorMessage", { message: err.message });
    // });
  });
};

export default socketController;
