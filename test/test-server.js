const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json())

app.use((req, res, next) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "content-type");
    next();
});

app.post("/api/monitor", (req, res, next) => {
    console.log(`Received message type: ${JSON.stringify(req.body, 4)}`);
    res.sendStatus(200);
});

app.listen(3000, () => {
    console.log("Listening...");
});