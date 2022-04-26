import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
const app = express();

let ips = [];
const EXPRESS_PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.json({ ips });
});

app.post("/add", (req, res) => {
  console.log(req.body);
  if (req?.body?.ip && ips.indexOf(req?.body?.ip) === -1) {
    ips.push(req.body.ip);
    res.sendStatus(204);
  } else {
    res.sendStatus(403);
  }
});

app.delete("/remove/:ip", (req, res) => {
  console.log(req.params);
  if (req?.params?.ip) {
    ips = ips.filter((ip) => ip != req.params.ip);
    res.sendStatus(204);
  } else {
    res.sendStatus(403);
  }
  console.log("deleted ip:",ips)
});

app.listen(EXPRESS_PORT, () => {
  console.log(`Server listening on port ${EXPRESS_PORT}`);
});
