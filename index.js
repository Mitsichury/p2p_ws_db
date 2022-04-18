import { WebSocket, WebSocketServer } from "ws";
import { networkInterfaces } from "os";

let mainServerSocketClient;
let secondaryServerSocketClient;

let p2pUsers = [];
let localServer = undefined;
const PORT = process.env.PORT || 3001;
const HOST = getLocalIp() + ":" + PORT;

function addIp(newIps) {
    p2pUsers = [...new Set([...p2pUsers, ...newIps])];
    console.log("All ips = ", p2pUsers);
}

function containsNewIps(p2ps, newP2ps) {
    return newP2ps.filter((ip) => p2ps.indexOf(ip) == -1).length > 0;
}

function broadcastData(data, server, other) {
    console.log("server", server != undefined, "other", other != undefined);
    server?.clients?.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN && client != server) {
            console.log(
                "server",
                client._socket.remoteAddress,
                client._socket.remotePort
            );
            client.send(data);
        }
    });
    if (other && other.readyState === WebSocket.OPEN) {
        other.send(data);
    }
}

function initServer() {
    if (localServer != undefined) {
        return;
    }
    console.log("Activate server for this node");
    localServer = new WebSocketServer({ port: PORT });
    localServer.on("connection", (socket) => {
        socket.send(
            JSON.stringify({
                type: "ips",
                content: p2pUsers,
            })
        );

        socket.on("message", (data) => {
            const { type, content } = JSON.parse(data);
            switch (type) {
                case "add_ip":
                    if (containsNewIps(p2pUsers, content)) {
                        console.log("Add new client to list:", content);
                        addIp(content);
                        broadcastData(
                            data,
                            localServer,
                            secondaryServerSocketClient
                        );
                    }
                    break;
                case "ips":
                    socket.send(
                        JSON.stringify({ type: "ips", content: p2pUsers })
                    );
                    break;
            }
        });
    });
}

function connectToAnother() {
    if (secondaryServerSocketClient != undefined) {
        console.log("Second server already defined");
        return;
    }
    const availableServers = p2pUsers.filter((ip) => ip != HOST);
    if (availableServers.length == 0) {
        console.log("No server available :", p2pUsers);
        return;
    }
    console.log("availableServers", availableServers);
    const serverToConnect =
        availableServers[Math.floor(Math.random() * availableServers.length)];
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
        server.send(
            JSON.stringify({
                type: "add_ip",
                content: [HOST],
            })
        );
        console.log("send my ip to ", serverToConnect, "my ips is", HOST);
        server.send(JSON.stringify({ type: "ips" }));
        console.log("Ask all ips to", serverToConnect);
    });

    server.addEventListener("message", ({ data }) => {
        const { type, content } = JSON.parse(data);
        console.log("Received message:", type, content);
        switch (type) {
            case "ips":
                if (containsNewIps(p2pUsers, content)) {
                    addIp(content);
                    connectToAnother();
                }
                break;
            case "add_ip":
                if (containsNewIps(p2pUsers, content)) {
                    console.log("Add new client to list:", content);
                    addIp(content);
                    broadcastData(
                        data,
                        localServer,
                        secondaryServerSocketClient
                    );
                }
                break;
        }
    });
}

function getLocalIp() {
    const nets = networkInterfaces();
    const results = Object.create(null); // Or just '{}', an empty object

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === "IPv4" && !net.internal) {
                if (!results[name]) {
                    results[name] = [];
                }
                results[name].push(net.address);
            }
        }
    }
    const localIp = results["Ethernet"] || results["ens160"];
    return localIp[0];
}

mainServerSocketClient = new WebSocket("ws://192.168.1.96:4000");
mainServerSocketClient.onerror = function () {
    console.log("could not contact server, maybe i'm the first one");    
};
configureClient(mainServerSocketClient);
initServer();
