const express = require("express");
const router = express.Router();
const { register, login, logout } = require("../controllers/authController");

// /api/v1/auth
router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);

module.exports = router;
