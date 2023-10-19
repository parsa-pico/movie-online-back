const Joi = require("joi");

module.exports = {
  staffId: Joi.string().required().max(500),
  title: Joi.string().required().max(55),
  floor: Joi.number().required().min(-100).max(100),
  desc: Joi.string().max(500),
};
