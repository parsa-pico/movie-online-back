const jwt = require("jsonwebtoken");
module.exports = function (req, res, next) {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).send("توکن وجود ندارد");

  try {
    const decoded = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
    if (!decoded.isStaff)
      return res.status(403).send("نبود سطح دسترسی کارمند ");
    req.user = decoded;
    next();
  } catch (error) {
    console.log(error);
    res.status(400).send("توکن نامعتبر ");
  }
};
