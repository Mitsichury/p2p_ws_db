import { isHashConsistent } from "../database/index.js";
import { TYPE } from "../model/thread_type.js";
import { isTransactionStatusValid } from "../model/transaction_status.js";
import { connectToOtherPeer } from "./client.js";

export const onMessage = (sockets, socket, rawData, database) => {
  const data = rawData.data || rawData;
  const { type, content } = JSON.parse(data);
  console.log("<--- Received", type, content, "from", socket._url);
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
      if (!database.entryExists(key) && isHashConsistent(value, key)) {
        database.addEntry(value, key);
        sockets.broadcast(data);
      }
      break;
    case TYPE.editEntry:
      const { id, status } = content;
      if (!database.entryExists(id) || !isTransactionStatusValid(status)) {
        return;
      }
      if(database.getEntry(id).status === status){
        return;
      }
      database.editEntry(id, status);
      sockets.broadcast(data);
      break;
    case TYPE.queryEntries:
      if (content) {
        database.addAll(content);
      } else {
        socket.send(JSON.stringify({ type: TYPE.queryEntries, content: database.getEntries() }));
      }
      break;
    case TYPE.removeIp:
      let broadcastData = false;
      if (sockets.clientExists(content)) {
        sockets.removeClient(content);
        broadcastData = true;
      }
      if (database.ipExists(content)) {
        database.removeIp(content);
        broadcastData = true;
      }
      if (broadcastData) {
        sockets.broadcast(data);
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
