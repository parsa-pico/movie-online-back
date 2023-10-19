const Joi = require("joi");
function validate(schema, obj, res) {
  const { error } = Joi.object(schema).validate(obj);
  if (error) return res.status(400).send(error.message);
  else return null;
}
function isObject(variable) {
  return typeof variable === "object" && variable !== null;
}
function validateDaysObject(inputObj) {
  // Validate the object structure
  if (!isObject(inputObj) || !inputObj) return false;
  for (const day in inputObj) {
    if (Array.isArray(inputObj[day]) && inputObj[day].length === 2) {
      // Validate the time format (HH:mm)
      const isValidTime = inputObj[day].every((time) =>
        /^([01]\d|2[0-3]):([0-5]\d)$/.test(time)
      );
      if (!isValidTime) {
        return false; // Return null if time format is invalid
      }
    } else {
      return false; // Return null if the structure is invalid
    }
  }

  return true;
}
function generateRandomCode(len) {
  const min = Math.pow(10, len - 1);
  const max = Math.pow(10, len) - 1;
  const randomDigit = Math.floor(Math.random() * (max - min + 1) + min);
  return randomDigit;
}
function getMinuteDifference(date1, date2) {
  const diffInMilliseconds = Math.abs(date2 - date1);
  const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60)); // 1 minute = 60,000 milliseconds
  return diffInMinutes;
}

function codeExpired(codeTime, thresholdMin) {
  const now = new Date();
  const diff = getMinuteDifference(now, codeTime);

  return diff > thresholdMin;
}
exports.codeExpired = codeExpired;
exports.validate = validate;
exports.validateDaysObject = validateDaysObject;
exports.generateRandomCode = generateRandomCode;
