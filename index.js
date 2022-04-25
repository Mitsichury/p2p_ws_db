import { getLocalIp } from "./ip_helper.js";
import { initializeDatabase } from "./src/database/index.js";
import { webserver } from "./src/webserver/index.js";
import { initializeSockets } from "./src/websocket/sockets.js";

const REGISTRY = process.env.REGISTRY || "192.168.1.96:4000";
const PORT = process.env.PORT || 3001;
const EXPRESS_PORT = +PORT + 1000;
const HOST = getLocalIp() + ":" + PORT;

const database = initializeDatabase();
const sockets = new initializeSockets(database, PORT, HOST, REGISTRY);
sockets.addClient(REGISTRY);
webserver(EXPRESS_PORT, REGISTRY, database, sockets).run();
