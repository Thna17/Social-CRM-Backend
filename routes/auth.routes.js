const express = require("express");
const { signup, login, logout, forgotPassword, resetPassword, verifyOtp } = require("../controllers/auth.controller");

const router = express.Router();

// Standard auth
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);


module.exports = router;
