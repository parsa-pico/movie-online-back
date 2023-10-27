const jwt = require("jsonwebtoken");
const db = require("../services/mongodb.js");
const { ObjectId } = require("mongodb");
const { ErrSender, authUser, ExpectedError } = require("./common.js");
const studentHandler = require("./studentHandler.js");
const staffHandler = require("./staffHandler.js");
const { v4: uuidv4 } = require("uuid");

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

    const sendUsers = () => {
      const currentRoomId = socket.handshake.currentRoom;
      if (!currentRoomId) return;
      const currentRoom = io.sockets.adapter.rooms.get(currentRoomId);
      if (!currentRoom) return;
      const currentUsers = [];

      currentRoom.forEach((id) => {
        const user = io.sockets.sockets.get(id);
        if (user) {
          const name = user.handshake.userName || "کاربر مهمان";
          currentUsers.push(name);
        }
      });
      console.log(currentUsers);
      io.to(currentRoomId).emit("getUsers", currentUsers);
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
      console.log("recevied a sub");
      const currentRoomId = socket.handshake.currentRoom;

      if (currentRoomId)
        socket.broadcast.to(currentRoomId).emit("subFile", file);
    });

    socket.safeOn("movieLink", (file) => {
      console.log("recevied a movie link");
      const currentRoomId = socket.handshake.currentRoom;

      if (currentRoomId)
        socket.broadcast.to(currentRoomId).emit("movieLink", file);
    });
    socket.safeOn("msg", (text, callback) => {
      const currentRoomId = socket.handshake.currentRoom;
      const name = socket.handshake.userName || "کاربر مهمان";
      console.log(currentRoomId);
      const obj = { name, text };
      if (currentRoomId) socket.broadcast.to(currentRoomId).emit("msg", obj);
      callback(obj);
    });

    socket.safeOn("joinRoom", async (roomId, name) => {
      await socket.join(roomId);
      await socket.broadcast.to(roomId).emit("alert", `${name} وارد اتاق شد`);
      console.log("a client joined room " + roomId);
      socket.handshake.currentRoom = roomId;
      socket.handshake.userName = name;
      sendUsers();
    });
    socket.safeOn("createRoom", (callback) => {
      const roomId = uuidv4();
      callback(roomId);
    });
    socket.safeOn("leaveRooms", () => {
      socket.leaveAll();
    });
    socket.on("disconnect", async () => {
      console.log("A client has disconnected");
      const currentRoomId = socket.handshake.currentRoom;
      const name = socket.handshake.userName;
      if (currentRoomId) {
        socket.broadcast.to(currentRoomId).emit("alert", `${name} قطع شد`);
      }
      await socket.leaveAll();
      sendUsers();
    });
  });
};
