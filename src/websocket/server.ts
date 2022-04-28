import { WebSocketServer } from "ws";
import { TYPE } from "../model/ThreadType.js";
import { Database } from '../database/Database';
import { onMessage } from "./on-message.js";
import { Sockets } from './sockets';

export function setupLocalWebsocketServer(sockets: Sockets, database: Database, port: number, host: string) {
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
