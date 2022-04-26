import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { TYPE } from "../model/thread_type.js";
import { isTransactionStatusValid } from "../model/transaction_status.js";

export function webserver(port, REGISTRY, database, sockets) {
  return {
    run: () => {
      const app = express();
      app.use(cors());
      app.use(bodyParser.json());

      app.get("/", (req, res) => {
        res.json({
          p2pUsers: database.getIps(),
          registry: REGISTRY,
          localServer: sockets.getServer()?._url,
          connections: sockets.getClients()?.map(({ _url }) => _url),
          database: database.getEntries(),
        });
      });

      app.post("/add", (req, res) => {
        const { key, value } = database.addEntry(req.body);
        sockets.broadcast(JSON.stringify({ type: TYPE.addEntry, content: { key, value } }));
        res.sendStatus(200);
      });

      app.put("/edit/:id", (req, res) => {
        if (!req?.params?.id || !req?.body?.status) {
          res.sendStatus(400);
          return;
        }
        if(!database.entryExists(req.params.id) || !isTransactionStatusValid(req.body.status)){
          console.log(req.params.id, req.body.status)
          res.sendStatus(403);
          return;
        }
        database.editEntry(req.params.id, req.body.status);
        sockets.broadcast(
          JSON.stringify({ type: TYPE.editEntry, content: { id: req.params.id, status: req.body.status } })
        );
        res.sendStatus(200);
      });

      app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
      });
    },
  };
}
