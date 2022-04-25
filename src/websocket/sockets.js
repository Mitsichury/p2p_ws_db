import { WebSocket } from "ws";
import { setupLocalWebsocketClient } from "./client.js";
import { setupLocalWebsocketServer } from "./server.js";

export function initializeSockets(database, PORT, HOST, REGISTRY) {
  this.clients = [];
  this.database = database;
  this.PORT = PORT;
  this.HOST = HOST;
  this.REGISTRY = REGISTRY;
  this.server = setupLocalWebsocketServer(this, database, PORT, HOST);

  this.addClient = (address) => {
    this.clients.push(setupLocalWebsocketClient(this, database, address, HOST));
  };

  this.getClients = () => {
    return this.clients;
  };

  this.getServer = () => {
    return this.server;
  };

  this.getConnectableServer = (ips) => {
    const connected = this.clients?.map(({ _url }) => _url);
    return ips.filter((ip) => ip != this.HOST && ip != this.REGISTRY && connected.indexOf(ip) === -1);
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
