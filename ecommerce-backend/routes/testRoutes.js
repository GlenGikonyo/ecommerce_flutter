const express = require("express");
const router = express.Router();
const db = require("../config/db"); // MySQL or PostgreSQL pool
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

// 🔍 DATABASE HEALTH CHECK
router.get("/db-test", async (req, res) => {
  try {
    const result = await db.query("SELECT NOW()");

    res.status(200).json({
      success: true,
      message: "✅ Database connected successfully",
      serverTime: result.rows[0].now,
    });

  } catch (error) {
    console.error("DB TEST ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: "❌ Database connection failed",
      error: error.message,
    });
  }
});

// 🔐 AUTH TEST
router.get("/protected", auth, (req, res) => {
  res.json({
    message: "You are authenticated",
    user: req.user,
  });
});


// 👑 ADMIN TEST
router.get("/admin-only", auth, admin, (req, res) => {
  res.json({ message: "Welcome admin" });
});

module.exports = router;
