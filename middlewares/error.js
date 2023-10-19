module.exports = function (err, req, res, next) {
  console.log(err);
  return res.status(500).send("خطای غیرمنتظره از سرور");
};
