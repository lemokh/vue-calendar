require("dotenv").config({
  silent: true
});

const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
const http = require("http");
const serialize = require("serialize-javascript");
const moment = require("moment-timezone");

moment.tz.setDefault("UTC");

app.use("/public", express.static(path.join(__dirname, "public")));

let events = [{
    description: "Random event 1",
    date: moment("2020-11-05", "YYY-MM-DD")
  },
  {
    description: "Random event 2",
    date: moment("2021-02-14", "YYY-MM-DD")
  }
]; // dummy data

let renderer;

app.get("/", (req, res) => {
  let template = fs.readFileSync(path.resolve("./index.html"), "utf-8");
  let contentMarker = "<!-- APP -->";
  if (renderer) {
    renderer.renderToString({
      events
    }, (err, html) => {
      if (err) {
        console.log(err);
      } else {
        res.send(
          template.replace(
            contentMarker,
            `<script>var __INITIAL_STATE__ = ${serialize(events)}</script>\n${{ html }}`
          )
        );
      }
    });
  } else {
    res.send('<p>Awaiting compilation...</p>');
  }
});

app.use(require("body-parser").json());

app.post("/add_event", (req, res) => {
  events.push({
    description: req.body.description,
    date: moment(req.body.date)
  });
  res.sendStatus(200);
});

const server = http.createServer(app);

if (process.env.NODE_ENV === "development") {
  const reload = require("reload");
  const reloadServer = reload(server, app);
  require("./webpack-dev-middleware").init(app);
  require("./webpack-server-compiler").init(function (bundle) {
    renderer = require('vue-server-renderer').createBundleRenderer(bundle);

  });
}

server.listen(process.env.PORT, function () {
  console.log(`Example app listening on port ${process.env.PORT}!`);
  if (process.env.NODE_ENV === "development") {
    require("open")(`http://localhost:${process.env.PORT}`);
  }
});