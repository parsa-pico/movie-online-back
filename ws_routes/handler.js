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
    socket.safeOn("joinRoom", (roomId) => {
      socket.join(roomId);
      socket.broadcast.to(roomId).emit("alert", "یک نفر اضافه شد");
      socket.handshake.currentRoom = roomId;
    });
    socket.on("disconnect", () => {
      console.log("A client has disconnected");
      const currentRoomId = socket.handshake.currentRoom;
      if (currentRoomId) {
        socket.broadcast.to(currentRoomId).emit("alert", "یک نفر قطع شد");
      }
      socket.leaveAll();
    });
  });
};
