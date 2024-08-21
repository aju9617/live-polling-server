const express = require("express");
const router = express.Router();
const healthCheck = require("./healthcheck");
const student = require("./student");

router.get("/health-check", healthCheck);
router.post("/add-student", student.addStudent);

module.exports = router;
