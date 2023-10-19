const express = require("express");
const router = express.Router();
const db = require("../services/mongodb");
const { validate, generateRandomCode } = require("../utils/common.js");
const loginSchema = require("../models/login.js");
const adminAuth = require("../middlewares/adminAuth");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const staffSchema = require("../models/staff");
const roomSchema = require("../models/room");
const staffAuth = require("../middlewares/staffAuth");
// const webpush = require("web-push");
// router.post("/subtest", async (req, res) => {
//   const publicKey =
//     "BAk5I2kthzXPoK38SivOCeKaqIPf8weSOcfsqdJasESoj0Zt3H7uENee95KSSBOC1qBGw4UK_xiE4nKrZWHyEtw";
//   const privateKey = "q2eFkUHJW-YMADlNVdmtzIviUWi-Wb_d2Vlo6AoS6Iw";
//   webpush.setVapidDetails(
//     "mailto:parsaforoozmand@gmail.com",
//     publicKey,
//     privateKey
//   );
//   const sub = req.body;
//   res.status(201).json({});
//   const payload = JSON.stringify({ title: "test" });
//   webpush.sendNotification(sub, payload).catch((err) => console.log(err));
// });
router.post("/login", async (req, res) => {
  const r = validate(loginSchema, req.body, res);
  if (r) return;
  const { phoneNumber, password } = req.body;
  const user = await db.findOne("staff", { phoneNumber });
  if (!user) return res.status(404).send("کاربر یافت نشد");

  const isAdmin = user.isAdmin ? true : false;
  const { firstName, lastName, phoneNumber: p, _id, studentCode } = user;
  const correctPass = await bcrypt.compare(password, user.password);
  if (!correctPass) return res.status(400).send("رمز صحیح نمیباشد");
  const token = jwt.sign(
    {
      firstName,
      lastName,
      phoneNumber: p,
      isAdmin,
      _id,
      studentCode,
      isStaff: true,
    },
    process.env.JWT_PRIVATE_KEY
  );
  return res.send(token);
});

// router.post("/sign-up", adminAuth, async (req, res) => {
//   const r = validate(teacherSchema, req.body, res);
//   if (r) return;
//   const { firstName, lastName, phoneNumber, password } = req.body;
//   user = await db.findOne("staff", {
//     $or: [{ phoneNumber }, { studentCode }],
//   });
//   if (user) return res.status(409).send("دانشجو قبلا ثبت شده");
//   encryptedPass = await bcrypt.hash(password, 10);
//   const result = await db.insertOne("staff", {
//     firstName,
//     lastName,
//     studentCode,
//     phoneNumber,
//     password: encryptedPass,
//     codeTime: new Date(),
//     code: generateRandomCode(4).toString(),
//   });
//   res.send(result);
// });

router.post("/sign-up", adminAuth, async (req, res) => {
  const r = validate(staffSchema, req.body, res);
  if (r) return;
  const { firstName, lastName, phoneNumber, password, isAdmin } = req.body;
  user = await db.findOne("staff", { phoneNumber });
  if (user) return res.status(409).send("شماره تلفن تکراری است");
  encryptedPass = await bcrypt.hash(password, 10);
  const result = await db.insertOne("staff", {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    phoneNumber,
    password: encryptedPass,
    isAdmin,
    codeTime: new Date(),
    code: generateRandomCode(4).toString(),
  });
  res.send(result);
});
router.get("/staff", adminAuth, async (req, res) => {
  const { firstName, lastName } = req.query;
  const result = await (
    await db.find("staff", {
      firstName: { $regex: new RegExp(firstName, "i") },
      lastName: { $regex: new RegExp(lastName, "i") },
    })
  ).toArray();
  res.send(result);
});

router.get("/rooms", staffAuth, async (req, res) => {
  const results = await db
    .getCollection("queue", "staffRooms")
    .aggregate([
      {
        $match: {
          staffId: new ObjectId(req.user._id),
        },
      },
      {
        $lookup: {
          from: "rooms",
          localField: "roomId",
          foreignField: "_id",
          as: "roomDetails",
        },
      },
      {
        $unwind: "$roomDetails",
      },
      {
        $project: {
          staffId: 1,
          roomDetails: 1,
        },
      },
    ])
    .toArray();

  return res.send(results);
});
router.get("/room/:id", adminAuth, async (req, res) => {
  const results = await db
    .getCollection("queue", "staffRooms")
    .aggregate([
      {
        $match: {
          staffId: new ObjectId(req.params.id),
        },
      },
      {
        $lookup: {
          from: "rooms",
          localField: "roomId",
          foreignField: "_id",
          as: "roomDetails",
        },
      },
      {
        $unwind: "$roomDetails",
      },
      {
        $project: {
          staffId: 1,
          roomDetails: 1,
        },
      },
    ])
    .toArray();

  return res.send(results);
});
router.post("/room", adminAuth, async (req, res) => {
  const r = validate(roomSchema, req.body, res);
  if (r) return;
  const { title, staffId, floor, desc } = req.body;
  const newRoom = await db.insertOne("rooms", {
    isWorking: false,
    queue: [],
    title,
    floor: parseInt(floor),
    desc,
  });
  await db.insertOne("staffRooms", {
    staffId: new ObjectId(staffId),
    roomId: new ObjectId(newRoom.insertedId),
  });
  res.send("اتاق با موفقیت ثبت شد");
});
router.post("/make-form", adminAuth, async (req, res) => {
  let { head, questions } = req.body;
  // console.log("head", head);
  // console.log("q", questions);
  const formResult = await db.insertOne("forms", { ...head, isActive: false });
  questions = questions.map((q) => {
    return { ...q, formId: formResult.insertedId };
  });
  const questionResult = await db.insertMany("questions", questions);
  res.send("سوالات با موفقیت ثبت شد");
});

router.get("/forms", adminAuth, async (req, res) => {
  const formsWithQuestions = await db
    .getCollection("queue", "forms")
    .aggregate([
      {
        $lookup: {
          from: "questions",
          localField: "_id",
          foreignField: "formId",
          as: "questions",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          isActive: 1,
          questions: {
            label: 1,
            type: 1,
            options: 1,
            _id: 1,
          },
        },
      },
    ])
    .toArray();
  res.send(formsWithQuestions);
});
router.post("/active-form", async (req, res) => {
  const { checked, _id } = req.body;
  if (checked) {
    await db.updateMany("forms", {}, { isActive: false });
  }
  await db.updateOne(
    "forms",
    { _id: new ObjectId(_id) },
    { isActive: checked }
  );
  res.send("تغییرات انجام شد");
});
router.post("/form-details", async (req, res) => {
  const formId = req.body._id;
  const result = await db
    .getCollection("queue", "questions")
    .aggregate([
      { $match: { formId: new ObjectId(formId) } },
      {
        $lookup: {
          from: "answers",
          localField: "_id",
          foreignField: "questionId",
          as: "answers",
        },
      },
      {
        $unwind: "$answers",
      },
      {
        $group: {
          _id: {
            _id: "$_id",
            selectedAnswer: "$answers.answer",
          },

          totalCount: { $sum: 1 },
          label: { $first: "$label" },
          type: { $first: "$type" },
        },
      },
      {
        $project: {
          _id: "$_id._id",
          label: 1,
          type: 1,
          totalCount: 1,
          selectedAnswer: "$_id.selectedAnswer",
        },
      },
    ])
    .toArray();

  res.send(result);
});
module.exports = router;
