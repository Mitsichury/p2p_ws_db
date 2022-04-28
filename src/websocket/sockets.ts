import { WebSocket, WebSocketServer } from "ws";
import { Database } from '../database/Database';
import { setupLocalWebsocketClient } from "./client.js";
import { setupLocalWebsocketServer } from "./server.js";

const WS_PREFIX = "ws://";

export class Sockets {

  clients: WebSocket[];
  database: Database;
  PORT: number;
  host: string;
  server: WebSocketServer;

  constructor(database: Database, port: number, host: string) {
    this.clients = [];
    this.database = database;
    this.PORT = port;
    this.host = host;
    this.server = setupLocalWebsocketServer(this, database, port, host);
  };

  addClient = (address: string) => {
    this.clients.push(setupLocalWebsocketClient(this, this.database, address, this.host));
  }
  removeClient = (address: string) => {
    const wsAddress = `${WS_PREFIX}${address}`;
    const clientToRemove = this.clients.filter((client) => client._url === wsAddress)[0];
    if (!clientToRemove) {
      return;
    }
    clientToRemove.close();
    this.clients = this.clients.filter((client) => client != clientToRemove);
  };

  clientExists = (address: string) => {
    const wsAddress = `${WS_PREFIX}${address}`;
    return !!this.clients.filter((client) => client._url === wsAddress)[0];
  };

  getClients = () => {
    return this.clients;
  };

  getServer = () => {
    return this.server;
  };

  getConnectableServer = (ips: string[]) => {
    const connected = this.clients?.map(({ url }) => url.replace(WS_PREFIX, ""));
    console.log("connected server:", connected);
    return ips.filter((ip) => ip != this.host && connected.indexOf(ip) === -1);
  };

  broadcast = (data: any) => {
    this.server?.clients?.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
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
