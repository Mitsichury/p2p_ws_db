import { WebSocket } from "ws";
import { Database } from '../database/Database';
import { TYPE } from "../model/ThreadType.js";
import { removeIpFromRegistry } from "../request-client/index.js";
import { onMessage } from "./on-message.js";
import { Sockets } from './sockets';

export function connectToOtherPeer(database: Database, sockets: Sockets) {
  const ips = database.getIps();
  const availableServers = sockets.getConnectableServer(database.getIps());

  if (availableServers.length == 0) {
    console.log("No server available :", ips);
    return;
  }
  console.log("availableServers", availableServers);
  availableServers.forEach((ip: string) => {
    console.log("new connection to ", ip);
    sockets.addClient(ip);
  });
}

export function setupLocalWebsocketClient(sockets: Sockets, database: Database, address: string, host: string) {
  let client = new WebSocket("ws://" + address);
  client.onerror = function () {
    console.log("Could not contact server");
  };
  client.onclose = (event) => {
    const ip = event.target.url.replace("ws://", "");
    console.log("Disconnected from", ip);
    sockets.removeClient(ip);
    sockets.broadcast(JSON.stringify({ type: TYPE.removeIp, content: ip }));
    removeIpFromRegistry(ip);
  };
  configureClient(sockets, client, address, database, host);
  return client;
}

function configureClient(sockets: Sockets, client: WebSocket, serverAddressToConnect: string, database: Database, host: string) {
  console.log("Configure client");
  client.addEventListener("open", () => {
    client.send(JSON.stringify({ type: TYPE.sendIp, content: [host] }));
    console.log("Sended my ip to ", serverAddressToConnect, "my ip is", host);
    client.send(JSON.stringify({ type: TYPE.askForIps }));
    console.log("Asked all ips to", serverAddressToConnect);
    client.send(JSON.stringify({ type: TYPE.queryEntries }));
    console.log("Asked all queries to", serverAddressToConnect);
  });
  client.addEventListener("message", (data) => {
    onMessage(sockets, client, data, database);
  });
}
