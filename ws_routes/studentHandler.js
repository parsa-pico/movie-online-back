const jwt = require("jsonwebtoken");
const db = require("../services/mongodb.js");
const { ObjectId } = require("mongodb");
const { getFirstUserDetails, ExpectedError } = require("./common.js");
module.exports = function (io, socket) {
  socket.safeOn("getroom", async (roomId, callback) => {
    const room = await db.findOne("rooms", { _id: new ObjectId(roomId) });
    if (!room) throw new ExpectedError("اتاق وجود ندارد");
    const queue = room.queue;
    callback(queue);
    socket.join(roomId);
  });

  socket.safeOn("subscribe", async (roomId, callback) => {
    const isValid = ObjectId.isValid(roomId);
    if (!isValid) throw new ExpectedError("آیدی اتاق معتبر نیست");

    const room = await db.findOne("rooms", { _id: new ObjectId(roomId) });
    if (!room) throw new ExpectedError("اتاق وجود ندارد");

    if (!room.isWorking) throw new ExpectedError("اتاق غیر فعال است");
    const queue = room.queue;

    const { _id: studentId } = socket.handshake.user;
    const isInQueue = queue.find((id) => id === studentId);
    // TODO: ADD THIS BACK
    if (isInQueue) throw new ExpectedError("شما یک نوبت فعال دارید");

    queue.push(studentId);

    await db.updateOne("rooms", { _id: new ObjectId(roomId) }, { queue });
    await db.insertOne("times", {
      studentId,
      roomId: new ObjectId(roomId),
      dateTime: new Date(),
    });
    roomId = roomId.toString();
    const originalQueue = [...queue];
    if (queue.length === 1) await getFirstUserDetails(queue);
    socket.leaveAll();
    socket.join(roomId);
    socket.emit("updateQueue", originalQueue);
    const staffRoomId = "staff" + roomId;
    if (queue.length === 1) io.to(staffRoomId).emit("updateQueue", queue);
    io.to(staffRoomId).emit("queueLength", queue.length);
    callback(1);
  });
  // socket.safeOn("disconnect", () => {});
};
