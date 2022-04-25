import { WebSocket, WebSocketServer } from "ws";
import { broadcastData } from "./helper.js";
import { initializeDatabase } from "./src/database/index.js";
import { webserver } from "./src/webserver/index.js";
import { getLocalIp } from "./ip_helper.js";
import { TYPE } from "./src/model/thread_type.js";

const REGISTRY = process.env.REGISTRY || "192.168.1.96:4000";
const PORT = process.env.PORT || 3001;
const EXPRESS_PORT = +PORT + 1000;
const HOST = getLocalIp() + ":" + PORT;

let localServer;
let mainServerSocketClient;
let secondaryServerSocketClient;
const database = initializeDatabase();

const onMessage = (socket, rawData, database) => {
  const data = rawData.data || rawData;
  const { type, content } = JSON.parse(data);
  console.log("<--- Received", type, "from", socket._url);
  switch (type) {
    case TYPE.sendIp:
      if (!socket._url) {
        socket._url = content[0];
      }
      add_ip(database, content, data, localServer, secondaryServerSocketClient);
      break;
    case TYPE.sendIpList:
      if (content) {
        receive_ips(database, content);
      } else {
        socket.send(JSON.stringify({ type: TYPE.sendIpList, content: database.getIps() }));
      }
      break;
    case TYPE.addEntry:
      const { key, value } = content;
      if (database.entryExists(key)) {
        database.addEntry(value, key);
        broadcastData(
          JSON.stringify({ type: TYPE.addEntry, content: { key, value } }),
          localServer,
          secondaryServerSocketClient
        );
      }
      break;
    case TYPE.queryEntries:
      if (content) {
        database.addAll(content);
      } else {
        socket.send(JSON.stringify({ type: TYPE.queryEntries, content: database.getEntries() }));
      }
      break;
  }
};

function initServer() {
  if (localServer != undefined) {
    return;
  }
  console.log("Activate server for this node");
  localServer = new WebSocketServer({ port: PORT });
  localServer.on("connection", (socket, req) => {
    socket.send(JSON.stringify({ type: TYPE.sendIpList, content: database.getIps() }));
    socket.on("message", function (data) {
      onMessage(socket, data, database);
    });
  });
}

function connectToAnother(database) {
  const p2ps = database.getIps();
  if (secondaryServerSocketClient != undefined) {
    console.log("Second server already defined");
    return;
  }
  const availableServers = p2ps.filter((ip) => ip != HOST && ip != REGISTRY);
  if (availableServers.length == 0) {
    console.log("No server available :", p2ps);
    return;
  }
  console.log("availableServers", availableServers);
  const serverToConnect = availableServers[Math.floor(Math.random() * availableServers.length)];
  console.log("new connection to ", serverToConnect);
  secondaryServerSocketClient = new WebSocket("ws://" + serverToConnect);
  configureClient(secondaryServerSocketClient, serverToConnect);
}

function configureClient(server, serverToConnect) {
  if (!server) {
    console.log("server instance is null");
    return;
  }
  console.log("Configure client");
  server.addEventListener("open", () => {
    server.send(JSON.stringify({ type: TYPE.sendIp, content: [HOST] }));
    console.log("Sended my ip to ", serverToConnect, "my ip is", HOST);
    server.send(JSON.stringify({ type: TYPE.askForIps }));
    console.log("Asked all ips to", serverToConnect);
    server.send(JSON.stringify({ type: TYPE.queryEntries }));
    console.log("Asked all queries to", serverToConnect);
  });
  server.addEventListener("message", function (data) {
    onMessage(server, data, database);
  });
}

function receive_ips(database, content) {
  if (database.containsUnknownIps(content)) {
    database.addIp(content);
    connectToAnother(database);
  }
}

function add_ip(database, content, data, localServer, secondaryServerSocketClient) {
  if (database.containsUnknownIps(content)) {
    console.log("Add new client to list:", content);
    database.addIp(content);
    broadcastData(data, localServer, secondaryServerSocketClient);
  }
}

/*------------------------------------- MAIN -------------------------------------*/
mainServerSocketClient = new WebSocket("ws://" + REGISTRY);
mainServerSocketClient.onerror = function () {
  console.log("could not contact server, maybe i'm the first one");
};
configureClient(mainServerSocketClient, REGISTRY);
initServer();

webserver(EXPRESS_PORT, REGISTRY, database, localServer, mainServerSocketClient, secondaryServerSocketClient).run();
