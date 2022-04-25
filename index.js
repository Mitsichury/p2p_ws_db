import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { v4 as uuidv4 } from "uuid";
import { WebSocket, WebSocketServer } from "ws";
import { addIp, broadcastData, containsNewIps } from "./helper.js";
import { getLocalIp } from "./ip_helper.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const REGISTRY = process.env.REGISTRY || "192.168.1.96:4000";
const PORT = process.env.PORT || 3001;
const EXPRESS_PORT = +PORT + 1000;
const HOST = getLocalIp() + ":" + PORT;

/*Missing ttl for messages, can spam*/
const TYPE = {
  askForIps: "ips",
  sendIpList: "ips",
  sendIp: "add_ip",
  addEntry: "add_entry",
  queryEntries: "query_entries",
};

let p2pUsers = [];
let localServer = undefined;
let mainServerSocketClient;
let secondaryServerSocketClient;
let database = {};

const onMessage = (socket, rawData, p2ps) => {
  const data = rawData.data || rawData;
  const { type, content } = JSON.parse(data);
  console.log("<--- Received", type, "from", socket._url);
  switch (type) {
    case TYPE.sendIp:
      if (!socket._url) {
        socket._url = content[0];
      }
      add_ip(p2ps, content, data, localServer, secondaryServerSocketClient);
      break;
    case TYPE.sendIpList:
      if (content) {
        receive_ips(p2ps, content);
      } else {
        socket.send(JSON.stringify({ type: TYPE.sendIpList, content: p2ps }));
      }
      break;
    case TYPE.addEntry:
      const { key, value } = content;
      if (Object.keys(database).indexOf(content.key) == -1) {
        database[key] = value;
        broadcastData(
          JSON.stringify({ type: TYPE.addEntry, content: { key, value } }),
          localServer,
          secondaryServerSocketClient
        );
      }
      break;
    case TYPE.queryEntries:
      if (content) {
        database = content;
      } else {
        socket.send(JSON.stringify({ type: TYPE.queryEntries, content: database }));
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
    socket.send(JSON.stringify({ type: TYPE.sendIpList, content: p2pUsers }));
    socket.on("message", function (data) {
      onMessage(socket, data, p2pUsers);
    });
  });
}

function connectToAnother(p2ps) {
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
    onMessage(server, data, p2pUsers);
  });
}

function receive_ips(p2ps, content) {
  if (containsNewIps(p2ps, content)) {
    p2pUsers = addIp(p2ps, content);
    connectToAnother(p2pUsers);
  }
}

function add_ip(p2ps, content, data, localServer, secondaryServerSocketClient) {
  if (containsNewIps(p2ps, content)) {
    console.log("Add new client to list:", content);
    p2pUsers = addIp(p2ps, content);
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

app.get("/", (req, res) => {
  res.json({
    p2pUsers,
    mainNode: REGISTRY,
    mainConnexion: mainServerSocketClient?._url,
    secondConnexion: secondaryServerSocketClient?._url,
    database,
  });
});

app.post("/add", (req, res) => {
  const id = uuidv4();
  database[id] = req.body;
  broadcastData(
    JSON.stringify({ type: TYPE.addEntry, content: { key: id, value: req.body } }),
    localServer,
    secondaryServerSocketClient
  );
  res.sendStatus(200);
});

app.listen(EXPRESS_PORT, () => {
  console.log(`Server listening on port ${EXPRESS_PORT}`);
});
