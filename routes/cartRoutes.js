const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem
} = require("../controllers/cartController");

router.post("/add", auth, addToCart);
router.get("/", auth, getCart);
router.put("/update", auth, updateCartItem);
router.delete("/remove/:productId", auth, removeCartItem);

module.exports = router;
