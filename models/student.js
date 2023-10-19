const Joi = require("joi");

module.exports = {
  firstName: Joi.string().required().max(45),
  lastName: Joi.string().required().max(45),
  phoneNumber: Joi.string().required().length(11),
  password: Joi.string().required().max(55),
  studentCode: Joi.string().required().max(45),
};
