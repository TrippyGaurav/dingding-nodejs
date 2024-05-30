import server from "./src/server";

const startServer = async () => {
  const port = 3000;
  server.listen(port, () => {
    console.log("Listening on port : ", port);
  });
};

startServer();
