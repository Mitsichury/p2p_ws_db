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
  availableServers.forEach((ip) => {
    console.log("new connection to ", ip);
    sockets.addClient(ip);
  });
}

export function setupLocalWebsocketClient(sockets, database, address, host) {
  let client = new WebSocket("ws://" + address);
  client.onerror = function () {
    console.log("Could not contact server");
  };
  configureClient(sockets, client, address, database, host);
  return client;
}
