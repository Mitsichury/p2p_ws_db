import { WebSocketServer } from "ws";
import { TYPE } from "../model/thread_type.js";
import { onMessage } from "./helper.js";

export function setupLocalWebsocketServer(sockets, database, port, host) {
  console.log("Activate server for this node");
  const localServer = new WebSocketServer({ port: port });
  localServer._url = host;
  localServer.on("connection", (socket, req) => {
    socket.send(JSON.stringify({ type: TYPE.sendIpList, content: database.getIps() }));
    socket.on("message", function (data) {
      onMessage(sockets, socket, data, database);
    });
  });
  return localServer;
}
