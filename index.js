import { WebSocket, WebSocketServer } from "ws";
import { getLocalIp } from "./ip_helper.js";
import { addIp, containsNewIps, broadcastData } from "./helper.js";

const MAIN_NODE = "192.168.1.96:4000";
const PORT = process.env.PORT || 3001;
const HOST = getLocalIp() + ":" + PORT;

const TYPE = {
  askForIps: "ips",
  sendIpList: "ips",
  sendIp: "add_ip",
};

let p2pUsers = [];
let localServer = undefined;
let mainServerSocketClient;
let secondaryServerSocketClient;

const onMessage = (socket, rawData, p2ps) => {
  const data = rawData.data || rawData;
  const { type, content } = JSON.parse(data);
  console.log("<--- Received", type, "from", socket._url);
  switch (type) {
    case "add_ip":
      if (!socket._url) {
        socket._url = content[0];
      }
      add_ip(p2ps, content, data, localServer, secondaryServerSocketClient);
      break;
    case "ips":
      if (content) {
        receive_ips(p2ps, content);
      } else {
        socket.send(JSON.stringify({ type: TYPE.sendIpList, content: p2ps }));
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
  const availableServers = p2ps.filter((ip) => ip != HOST && ip != MAIN_NODE);
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
mainServerSocketClient = new WebSocket("ws://" + MAIN_NODE);
mainServerSocketClient.onerror = function () {
  console.log("could not contact server, maybe i'm the first one");
};
configureClient(mainServerSocketClient, MAIN_NODE);
initServer();
