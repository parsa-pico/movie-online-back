const jwt = require("jsonwebtoken");
const db = require("../services/mongodb.js");
const { ObjectId } = require("mongodb");
const { ErrSender, authUser, ExpectedError } = require("./common.js");
const studentHandler = require("./studentHandler.js");
const staffHandler = require("./staffHandler.js");

module.exports = function (io) {
  // Socket.IO connection event
  io.on("connection", (socket) => {
    socket.safeOn = function (eventName, eventHandler) {
      const wrappedHandler = async function (...args) {
        try {
          await eventHandler(...args);
        } catch (error) {
          console.log("Error:", error);

          if (error instanceof ExpectedError)
            socket.emit("error", { msg: error.message });
          else socket.emit("error", { msg: "خطای غیرمنتظره از سرور" });
        }
      };
      socket.on(eventName, wrappedHandler);
    };

    socket.safeOn("time", (time, t1, play) => {
      const currentRoomId = socket.handshake.currentRoom;
      if (currentRoomId)
        socket.broadcast.to(currentRoomId).emit("time", time, t1, play);
    });
    socket.safeOn("subDelay", (delay) => {
      const currentRoomId = socket.handshake.currentRoom;
      if (currentRoomId)
        socket.broadcast.to(currentRoomId).emit("subDelay", delay);
    });
    socket.safeOn("subFile", (file) => {
      console.log("recevied a file");
      const currentRoomId = socket.handshake.currentRoom;
      console.log(currentRoomId);
      if (currentRoomId)
        socket.broadcast.to(currentRoomId).emit("subFile", file);
    });
    socket.safeOn("joinRoom", (roomId, name) => {
      socket.join(roomId);
      socket.broadcast.to(roomId).emit("alert", `${name} وارد اتاق شد`);
      console.log("a client joined room " + roomId);
      socket.handshake.currentRoom = roomId;
      socket.handshake.userName = name;
    });
    socket.on("disconnect", () => {
      console.log("A client has disconnected");
      const currentRoomId = socket.handshake.currentRoom;
      const name = socket.handshake.userName;
      if (currentRoomId) {
        socket.broadcast.to(currentRoomId).emit("alert", `${name} قطع شد`);
      }
      socket.leaveAll();
    });
  });
};
