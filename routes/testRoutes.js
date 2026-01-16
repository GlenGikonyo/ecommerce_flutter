const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

router.get("/db-test", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 + 1 AS result");
    res.json({
      success: true,
      message: "Database connected successfully",
      result: rows[0].result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

router.get("/protected", auth, (req, res) => {
    res.json({ message: "You are authenticated", user: req.user });
});
  
router.get("/auth/admin-only", auth, admin, (req, res) => {
    res.json({ message: "Welcome admin" });
  });
  

module.exports = router;
