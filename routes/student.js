const { ObjectId } = require("bson");
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const db = require("../services/mongodb");
const { default: axios } = require("axios");
const bcrypt = require("bcrypt");
const studentAuth = require("../middlewares/studentAuth");
const {
  validate,
  generateRandomCode,
  codeExpired,
} = require("../utils/common.js");
const loginSchema = require("../models/login");
const studentSchema = require("../models/student");
const config = require("../configs.json");
router.get("/rooms", studentAuth, async (req, res) => {
  const results = await (await db.find("rooms", {})).toArray();
  return res.send(results);
});

router.post("/login", async (req, res) => {
  const r = validate(loginSchema, req.body, res);
  if (r) return;
  const { phoneNumber, password } = req.body;
  const user = await db.findOne("students", { phoneNumber });
  if (!user) return res.status(404).send("کاربر یافت نشد");

  const { firstName, lastName, phoneNumber: p, _id, studentCode } = user;
  const correctPass = await bcrypt.compare(password, user.password);
  if (!correctPass) return res.status(400).send("رمز صحیح نمیباشد");
  const token = jwt.sign(
    {
      firstName,
      lastName,
      phoneNumber: p,
      _id,
      studentCode,
      isAdmin: false,
      isStaff: false,
    },
    process.env.JWT_PRIVATE_KEY
  );
  return res.send(token);
});

router.post("/sign-up", async (req, res) => {
  const r = validate(studentSchema, req.body, res);
  if (r) return;
  const { firstName, lastName, phoneNumber, password, studentCode } = req.body;
  user = await db.findOne("students", {
    $or: [{ phoneNumber }, { studentCode }],
  });
  if (user)
    return res.status(409).send("شماره تلفن یا شماره دانشجویی تکراری است");
  encryptedPass = await bcrypt.hash(password, 10);
  const result = await db.insertOne("students", {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    studentCode,
    phoneNumber,
    password: encryptedPass,
    codeTime: new Date(),
    code: generateRandomCode(4).toString(),
  });
  res.send(result);
});
router.post("/send-code", async (req, res) => {
  const { phoneNumber } = req.body;
  const user = await db.findOne("students", { phoneNumber });
  if (!user) return res.status(404).send("کاربر یافت نشد");
  const threshold = config.codeExpires; //minutes
  const isExpired = codeExpired(user.codeTime, threshold);

  if (!isExpired)
    return res.status(429).send("ارسال بیش از حد مجاز،چند دقیقه صبر کنید");
  const randomCode = generateRandomCode(4).toString();
  try {
    const { data } = await axios.post(
      "https://api.sms.ir/v1/send/verify",
      {
        mobile: phoneNumber,
        templateId: 100000,
        parameters: [
          {
            name: "Code",
            value: randomCode,
          },
        ],
      },
      {
        headers: {
          "x-api-key": process.env.SMS_KEY,
        },
      }
    );
    console.log(data);
  } catch (error) {
    console.log(error);
    return res.status(499).send("سامانه پیامکی در دسترس نمیباشد");
  }

  const result = await db.updateOne(
    "students",
    { phoneNumber },
    { code: randomCode, codeTime: new Date() }
  );
  console.log(result);
  return res.send({ msg: "کد ارسال شد", codeExpires: config.codeExpires });
});
router.post("/reset-pass", async (req, res) => {
  const { phoneNumber, code, password } = req.body;
  const user = await db.findOne("students", { phoneNumber });
  if (!user) return res.status(404).send("کاربر یافت نشد");
  const threshold = config.codeExpires; //minutes
  const isExpired = codeExpired(user.codeTime, threshold);
  if (isExpired) return res.status(403).send("کد منقضی شده است");
  console.log(code, user.code);
  const correctCode = user.code === code;
  if (!correctCode) return res.status(400).send("کد اشتباه است");
  encryptedPass = await bcrypt.hash(password, 10);
  const result = await db.updateOne(
    "students",
    { phoneNumber },
    {
      code: generateRandomCode(4).toString(),
      password: encryptedPass,
      codeTime: new Date(),
    }
  );
  return res.send(result);
});
router.get("/form", studentAuth, async (req, res) => {
  const activeForm = await db.findOne("forms", { isActive: true });
  if (!activeForm) return res.send(false);

  const userSubmittedForm = await db.findOne("answeredForms", {
    userId: new ObjectId(req.user._id),
    formId: new ObjectId(activeForm._id),
  });

  if (userSubmittedForm) return res.send(false);

  const questions = await (
    await db.find("questions", {
      formId: new ObjectId(activeForm._id),
    })
  ).toArray();
  const obj = { questions, ...activeForm };
  res.send(obj);
});

router.post("/form", studentAuth, async (req, res) => {
  const { head, answers } = req.body;

  const userSubmittedForm = await db.findOne("answeredForms", {
    userId: new ObjectId(req.user._id),
    formId: new ObjectId(head._id),
  });

  if (userSubmittedForm) return res.status(403).send("یک مشارکت ثبت شده");

  const { insertedId } = await db.insertOne("answeredForms", {
    userId: new ObjectId(req.user._id),
    formId: new ObjectId(head._id),
  });

  const answersMapped = [];
  for (let key in answers) {
    const isArray = Array.isArray(answers[key]);
    if (!isArray)
      answersMapped.push({
        answeredFormId: new ObjectId(insertedId),
        questionId: new ObjectId(key),
        answer: answers[key],
      });
    else {
      const answersArray = answers[key];
      answersArray.forEach((answer) => {
        answersMapped.push({
          answeredFormId: new ObjectId(insertedId),
          questionId: new ObjectId(key),
          answer: answer,
        });
      });
    }
  }
  await db.insertMany("answers", answersMapped);
  res.send("جواب ها ذخیره شد");
});
module.exports = router;
