import { WebSocket } from "ws";
import { configureClient } from "./helper.js";

export function connectToAnother(database, sockets) {
  const ips = database.getIps();
  const availableServers = sockets.getConnectableServer(database.getIps());

  if (availableServers.length == 0) {
    console.log("No server available :", ips);
    return;
  }
  console.log("availableServers", availableServers);
  const serverToConnect = availableServers[Math.floor(Math.random() * availableServers.length)];
  console.log("new connection to ", serverToConnect);
  sockets.addClient(serverToConnect);
}

export function setupLocalWebsocketClient(sockets, database, address, host) {
  let client = new WebSocket("ws://" + address);
  client.onerror = function () {
    console.log("Could not contact server");
  };
  configureClient(sockets, client, address, database, host);
  return client;
}
