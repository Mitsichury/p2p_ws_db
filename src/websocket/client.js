import axios from "axios";
import { WebSocket } from "ws";
import { TYPE } from "../model/thread_type.js";
import { onMessage } from "./helper.js";

export function connectToOtherPeer(database, sockets) {
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
  client.onclose = (event) => {
    const ip = event.target._url.replace("ws://");
    console.log("setupLocalWebsocketClient.onclose Disconnected!", ip);
    sockets.broadcast(JSON.stringify({ type: TYPE.removeIp, content: ip }));
    axios.delete(`http://192.168.1.96:4000/remove`, { ip });
  };
  configureClient(sockets, client, address, database, host);
  return client;
}

function configureClient(sockets, server, serverAddressToConnect, database, host) {
  console.log("Configure client");
  server.addEventListener("open", () => {
    server.send(JSON.stringify({ type: TYPE.sendIp, content: [host] }));
    console.log("Sended my ip to ", serverAddressToConnect, "my ip is", host);
    server.send(JSON.stringify({ type: TYPE.askForIps }));
    console.log("Asked all ips to", serverAddressToConnect);
    server.send(JSON.stringify({ type: TYPE.queryEntries }));
    console.log("Asked all queries to", serverAddressToConnect);
  });
  server.addEventListener("message", function (data) {
    onMessage(sockets, server, data, database);
  });
}
