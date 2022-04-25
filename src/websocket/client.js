import { WebSocket } from "ws";
import { configureClient } from "./helper.js";

export function connectToAnother(database, host, registry, sockets) {
  const p2ps = database.getIps();
  const availableServers = p2ps.filter((ip) => ip != host && ip != registry);
  if (availableServers.length == 0) {
    console.log("No server available :", p2ps);
    return;
  }
  console.log("availableServers", availableServers);
  const serverToConnect = availableServers[Math.floor(Math.random() * availableServers.length)];
  console.log("new connection to ", serverToConnect);
  sockets.addClient(serverToConnect);
}

export function setupLocalWebsocketClient(sockets, address, database, host, registry) {
  let client = new WebSocket("ws://" + address);
  client.onerror = function () {
    console.log("Could not contact server");
  };
  configureClient(sockets, client, address, database, host, registry);
  return client;
}
