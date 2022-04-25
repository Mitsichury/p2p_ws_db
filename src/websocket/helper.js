import { TYPE } from "../model/thread_type.js";
import { connectToAnother } from "./client.js";

export const onMessage = (sockets, socket, rawData, database) => {
  const data = rawData.data || rawData;
  const { type, content } = JSON.parse(data);
  console.log("<--- Received", type, "from", socket._url);
  switch (type) {
    case TYPE.sendIp:
      if (!socket._url) {
        socket._url = content[0];
      }
      add_ip(database, content, data, sockets);
      break;
    case TYPE.sendIpList:
      if (content) {
        add_ip(database, content, data, sockets, true);
      } else {
        socket.send(JSON.stringify({ type: TYPE.sendIpList, content: database.getIps() }));
      }
      break;
    case TYPE.addEntry:
      const { key, value } = content;
      if (database.entryExists(key)) {
        database.addEntry(value, key);
        sockets.broadcast(JSON.stringify({ type: TYPE.addEntry, content: { key, value } }));
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

function add_ip(database, content, data, sockets, broadcast = false) {
  if (database.containsUnknownIps(content)) {
    database.addIp(content);
    connectToAnother(database, sockets);
    if (broadcast) {
      sockets.broadcast(data);
    }
  }
}

export function configureClient(sockets, server, serverAddressToConnect, database, host) {
  if (!server) {
    console.log("server instance is null");
    return;
  }
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
