import { getLocalIp } from "./ip_helper.js";
import { initializeDatabase } from "./src/database/index.js";
import { getRegistryIps, removeIpFromRegistry, sendIpToRegistry } from "./src/request-client/index.js";
import { webserver } from "./src/webserver/index.js";
import { connectToOtherPeer } from "./src/websocket/client.js";
import { initializeSockets } from "./src/websocket/sockets.js";
import { TYPE } from "./src/model/thread_type.js";
import publicIp from "public-ip";
import "dotenv/config";

const REGISTRY = process.env.REGISTRY;
const PORT = process.env.PORT;
const EXPRESS_PORT = process.env.EXPRESS_PORT || +PORT + 1000;
const host = process.env.LOCAL_ONLY == 1 ? getLocalIp() + ":" + PORT : (await publicIp.v4()) + ":" + PORT;
console.log("HOST is", host);

const database = initializeDatabase();
const sockets = new initializeSockets(database, PORT, host);

getRegistryIps()
  .then(({ data }) => {
    if (data?.ips?.length > 0) {
      database.addIp(data.ips);
      connectToOtherPeer(database, sockets);
    } else {
      console.log("/!\\ FIRST NODE AVAILABLE !");
    }
    webserver(EXPRESS_PORT, REGISTRY, database, sockets).run();
    sendIpToRegistry(host)
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
  try {
    await removeIpFromRegistry(host);
  } catch (e) {
    console.log("Error while sending data to registry", e);
  }
  sockets.broadcast(JSON.stringify({ type: TYPE.removeIp, content: host }));
  process.exit(0);
}

process.on("SIGTERM", () => {
  gracefulShutdown();
});
process.on("SIGINT", () => {
  gracefulShutdown();
});
