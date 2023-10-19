const Joi = require("joi");

module.exports = {
  phoneNumber: Joi.string().required().length(11),
  password: Joi.string().required().max(55),
};
