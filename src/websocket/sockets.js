import { WebSocket } from "ws";
import { setupLocalWebsocketClient } from "./client.js";
import { setupLocalWebsocketServer } from "./server.js";

export function initializeSockets(database, PORT, HOST, REGISTRY) {
  this.clients = [];
  this.database = database;
  this.PORT = PORT;
  this.HOST = HOST;
  this.REGISTRY = REGISTRY;
  this.server = setupLocalWebsocketServer(this, database, PORT, HOST, REGISTRY);

  this.addClient = (address) => {
    this.clients.push(setupLocalWebsocketClient(this, address, database, HOST, REGISTRY));
  };

  this.getClients = () => {
    return this.clients;
  };

  this.getServer = () => {
    return this.server;
  };

  this.broadcast = (data) => {
    const self = this;
    console.log(this.server)
    this.server?.clients?.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN && client != self.server) {
        client.send(data);
      }
    });
    for (let client in this.clients) {
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  };
}
