require("dotenv").config();
require("./startup/config")();
require("express-async-errors");
// const dbService = require("./services/mongodb");

// dbService.getClient().connect();
const app = require("express")();
server = require("./startup/routes")(app);

const port = process.env.PORT || 3000;
server.listen(port, () => console.log("listening on port " + port));
