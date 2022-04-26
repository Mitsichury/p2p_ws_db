import { getLocalIp } from "./ip_helper.js";
import { initializeDatabase } from "./src/database/index.js";
import { getRegistryIps, removeIpFromRegistry, sendIpToRegistry } from "./src/request-client/index.js";
import { webserver } from "./src/webserver/index.js";
import { connectToOtherPeer } from "./src/websocket/client.js";
import { initializeSockets } from "./src/websocket/sockets.js";
import { TYPE } from "./src/model/thread_type.js";

const REGISTRY = process.env.REGISTRY || "http://192.168.1.96:4000";
const PORT = process.env.PORT || 3001;
const EXPRESS_PORT = +PORT + 1000;
const HOST = getLocalIp() + ":" + PORT;

const database = initializeDatabase();
const sockets = new initializeSockets(database, PORT, HOST);

getRegistryIps()
  .then(({ data }) => {
    if (data?.ips?.length > 0) {
      console.log(data);
      database.addIp(data.ips);
      connectToOtherPeer(database, sockets);
    } else {
      console.log("/!\\ FIRST NODE AVAILABLE !");
    }
    webserver(EXPRESS_PORT, REGISTRY, database, sockets).run();
    sendIpToRegistry(HOST)
      .then(() => {
        console.log("Ip sent to registry");
      })
      .catch((error) => {
        console.log("Could not send ip to registry", error);
      });
  })
  .catch(function (error) {
    console.log(error);
    process.exit(1);
  });

async function gracefulShutdown() {
  await removeIpFromRegistry(HOST);
  sockets.broadcast(JSON.stringify({ type: TYPE.removeIp, content: HOST }));
  process.exit(0);
}

process.on("SIGTERM", () => {
  gracefulShutdown();
});
process.on("SIGINT", () => {
  gracefulShutdown();
});
