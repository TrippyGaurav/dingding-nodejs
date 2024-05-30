import { v4 as uuidv4 } from "uuid";
import { clients } from "../utils/utils";
import { messageHandler } from "./handler";

const socketController = (io) => {
  io.on("connection", (socket) => {
    io.emit("newConnectionAlert", "A new user has connected!");

    let isAlive = true;

    // Generate a unique client ID
    const clientId = uuidv4();
    clients.set(clientId, socket);

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

    socket.on("message", messageHandler(socket));

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });
};

export default socketController;
