const express = require("express");
const cors = require("cors");
const error = require("../middlewares/error");
const admin = require("../routes/admin.js");
const student = require("../routes/student.js");
const socketIo = require("socket.io");
const wsHandler = require("../ws_routes/handler.js");
const http = require("http");

module.exports = function (app) {
  app.use(cors());
  const server = http.createServer(app);
  const io = socketIo(server, { cors: { credentials: true } });
  wsHandler(io);

  // app.use(express.json());
  // app.use(express.urlencoded({ extended: true }));
  // app.use("/admin", admin);
  // app.use("/student", student);
  // app.use(error);
  return server;
};
