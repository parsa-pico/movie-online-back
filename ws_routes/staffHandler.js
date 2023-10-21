// const jwt = require("jsonwebtoken");
// const db = require("../services/mongodb.js");
// const { ObjectId } = require("mongodb");
// const { getFirstUserDetails, ExpectedError } = require("./common.js");
// module.exports = function (io, socket) {
//   socket.safeOn("joinRoom", async (roomId, callback) => {
//     socket.join("staff" + roomId);
//     const room = await db.findOne("rooms", { _id: new ObjectId(roomId) });
//     const queue = room.queue;
//     if (queue.length !== 0) await getFirstUserDetails(queue);
//     socket.emit("updateQueue", queue);
//     callback(room);
//   });

//   socket.safeOn("leaveRoom", () => {
//     socket.leaveAll();
//   });

//   socket.safeOn("workingState", async (room, callback) => {
//     const roomId = room._id;
//     const isWorking = room.isWorking;
//     if (typeof isWorking !== "boolean")
//       throw new ExpectedError("وضعیت اتاق باید بولین باشد");
//     const isValid = ObjectId.isValid(roomId);
//     if (!isValid) throw new ExpectedError("آیدی اتاق معتبر نیست");

//     const { matchedCount } = await db.updateOne(
//       "rooms",
//       { _id: new ObjectId(roomId) },
//       { isWorking }
//     );
//     if (matchedCount === 0) throw new ExpectedError("اتاق وجود ندارد");
//     callback(true);
//   });

//   socket.safeOn("next", async (roomId, callback) => {
//     const isValid = ObjectId.isValid(roomId);
//     if (!isValid) throw new ExpectedError("آیدی اتاق معتبر نیست");

//     const room = await db.findOne("rooms", { _id: new ObjectId(roomId) });
//     if (!room) throw new ExpectedError("اتاق وجود ندارد");
//     const queue = room.queue;
//     if (queue.length === 0) throw new ExpectedError("نوبتی وجود ندارد");
//     queue.shift();
//     const originalQueue = [...queue];
//     await db.updateOne("rooms", { _id: new ObjectId(roomId) }, { queue });
//     roomId = room._id.toString();
//     if (queue.length !== 0) await getFirstUserDetails(queue);

//     io.to(roomId).emit("updateQueue", originalQueue);
//     socket.emit("updateQueue", queue);
//     callback(1);
//   });
// };
