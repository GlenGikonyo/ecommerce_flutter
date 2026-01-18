const express = require("express");
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct
} = require("../controllers/productController");

const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/authMiddleware");

// Public
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// Admin
router.post("/", auth, admin, createProduct);
router.put("/:id", auth, admin, updateProduct);
router.delete("/:id", auth, admin, deleteProduct);

module.exports = router;
