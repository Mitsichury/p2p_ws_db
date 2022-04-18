import { WebSocket } from "ws";

export function containsNewIps(p2ps, newP2ps) {
  return newP2ps.filter((ip) => p2ps.indexOf(ip) == -1).length > 0;
}

export function broadcastData(data, server, other) {
  console.log("server", server != undefined, "other", other != undefined);
  server?.clients?.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN && client != server) {
      client.send(data);
    }
  });
  if (other && other.readyState === WebSocket.OPEN) {
    other.send(data);
  }
}

export function addIp(p2pUsers, newIps) {
  const newP2pUsers = [...new Set([...p2pUsers, ...newIps])];
  console.log("All ips = ", newP2pUsers);
  return newP2pUsers;
}
