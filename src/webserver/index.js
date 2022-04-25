import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { broadcastData } from "../../helper.js";
import { TYPE } from "../model/thread_type.js";

export function webserver(port, REGISTRY, database, localServer, mainServerSocketClient, secondaryServerSocketClient) {
  return {
    run: () => {
      const app = express();
      app.use(cors());
      app.use(bodyParser.json());

      app.get("/", (req, res) => {
        res.json({
          p2pUsers: database.getIps(),
          registry: REGISTRY,
          mainConnexion: mainServerSocketClient?._url,
          secondConnexion: secondaryServerSocketClient?._url,
          database: database.getEntries(),
        });
      });

      app.post("/add", (req, res) => {
        const { key, value } = database.addEntry(req.body);
        broadcastData(
          JSON.stringify({ type: TYPE.addEntry, content: { key, value } }),
          localServer,
          secondaryServerSocketClient
        );
        res.sendStatus(200);
      });
      app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
      });
    },
  };
}
