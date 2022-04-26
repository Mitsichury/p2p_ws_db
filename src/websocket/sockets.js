import { WebSocket } from "ws";
import { setupLocalWebsocketClient } from "./client.js";
import { setupLocalWebsocketServer } from "./server.js";

export function initializeSockets(database, PORT, HOST) {
  this.clients = [];
  this.database = database;
  this.PORT = PORT;
  this.HOST = HOST;
  this.server = setupLocalWebsocketServer(this, database, PORT, HOST);

  this.addClient = (address) => {
    this.clients.push(setupLocalWebsocketClient(this, database, address, HOST));
  };

  this.removeClient = (address) => {
    const clientToRemove = this.clients.filter((client) => client._url === address)[0];
    if (!clientToRemove) {
      return;
    }
    clientToRemove.close();
    this.clients = this.clients.filter((client) => client != clientToRemove);
  };

  this.clientExists = (address) => {
    return !!(this.clients.filter((client) => client._url === address)[0])
  };

  this.getClients = () => {
    return this.clients;
  };

  this.getServer = () => {
    return this.server;
  };

  this.getConnectableServer = (ips) => {
    const connected = this.clients?.map(({ _url }) => _url.replace("ws://", ""));
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
