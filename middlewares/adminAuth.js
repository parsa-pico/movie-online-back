const jwt = require("jsonwebtoken");
module.exports = function (req, res, next) {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).send("no token provided");

  try {
    const decoded = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
    if (!decoded.isAdmin) return res.status(403).send("not an admin");
    next();
  } catch (error) {
    console.log(error);
    res.status(400).send("invalid token");
  }
};
