const jwt = require("jsonwebtoken");
const db = require("../services/mongodb.js");
const { ObjectId } = require("mongodb");
module.exports.authUser = function authUser(socket) {
  const token = socket.handshake.query.token;

  if (!token) {
    socket.emit("error", { msg: "توکن وجود ندارد" });
    return false;
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
    socket.handshake.user = decoded;
    return true;
  } catch (error) {
    console.log(error);
    socket.emit("error", { msg: "توکن معتبر نیست " });
    return false;
  }
};

module.exports.ErrSender = class ErrSender {
  constructor(socket, callback) {
    this.socket = socket;
  }
  async send(msg) {
    this.socket.emit("error", { msg });
  }
};

module.exports.getFirstUserDetails = async (queue) => {
  const result = await db.findOne("students", {
    _id: new ObjectId(queue[0]),
  });
  queue[0] = result;
};
module.exports.ExpectedError = class ExpectedError extends Error {
  constructor(message) {
    super(message);
    this.name = "ExpectedWebSocketError";
  }
};
