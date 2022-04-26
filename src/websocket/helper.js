import { TYPE } from "../model/thread_type.js";
import { connectToOtherPeer } from "./client.js";

export const onMessage = (sockets, socket, rawData, database) => {
  const data = rawData.data || rawData;
  const { type, content } = JSON.parse(data);
  console.log("<--- Received", type, "from", socket._url);
  switch (type) {
    case TYPE.sendIp:
      if (!socket._url) {
        socket._url = content[0];
      }
      add_ip(content, data);
      break;
    case TYPE.sendIpList:
      if (content) {
        add_ip(content, data, true);
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

  function add_ip(content, data, broadcast = false) {
    if (database.containsUnknownIps(content)) {
      database.addIp(content);
      connectToOtherPeer(database, sockets);
      if (broadcast) {
        sockets.broadcast(data);
      }
    }
  }
};