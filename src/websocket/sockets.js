import { WebSocket } from "ws";
import { setupLocalWebsocketClient } from "./client.js";
import { setupLocalWebsocketServer } from "./server.js";

const WS_PREFIX = "ws://";

export function initializeSockets(database, port, host) {
  this.clients = [];
  this.database = database;
  this.PORT = port;
  this.HOST = host;
  this.server = setupLocalWebsocketServer(this, database, port, host);

  this.addClient = (address) => {
    this.clients.push(setupLocalWebsocketClient(this, database, address, host));
  };

  this.removeClient = (address) => {
    const wsAddress = `${WS_PREFIX}${address}`;
    const clientToRemove = this.clients.filter((client) => client._url === wsAddress)[0];
    if (!clientToRemove) {
      return;
    }
    clientToRemove.close();
    this.clients = this.clients.filter((client) => client != clientToRemove);
  };

  this.clientExists = (address) => {
    const wsAddress = `${WS_PREFIX}${address}`;
    return !!this.clients.filter((client) => client._url === wsAddress)[0];
  };

  this.getClients = () => {
    return this.clients;
  };

  this.getServer = () => {
    return this.server;
  };

  this.getConnectableServer = (ips) => {
    const connected = this.clients?.map(({ _url }) => _url.replace(WS_PREFIX, ""));
    console.log("connected server:", connected);
    return ips.filter((ip) => ip != this.HOST && connected.indexOf(ip) === -1);
  };

  this.broadcast = (data) => {
    const self = this;
    this.server?.clients?.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client != self.server) {
        client.send(data);
      }
    });
    this.clients?.forEach((client) => {
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  };
}
