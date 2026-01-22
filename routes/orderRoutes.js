const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

const {
  placeOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus
} = require("../controllers/orderController");

// User
router.post("/", auth, placeOrder);
router.get("/my-orders", auth, getMyOrders);

// Admin
router.get("/", auth, admin, getAllOrders);
router.put("/:id", auth, admin, updateOrderStatus);

module.exports = router;
