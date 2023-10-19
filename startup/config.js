module.exports = function () {
  const env_inputs = [
    "JWT_PRIVATE_KEY",
    "MONGO_URL",
    "ADMIN_PASS",
    "BACK_END_URL",
    "SMS_KEY",
  ];
  for (let input of env_inputs) {
    if (!process.env[input]) {
      const msg = `${input} not defined`;
      console.log(msg);
      throw new Error(msg);
    }
  }
};
