import { WebSocket } from "ws";

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