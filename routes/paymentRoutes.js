const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const paymentController = require("../controllers/paymentController");

// Initiate M-Pesa STK Push
router.post("/mpesa", auth, paymentController.initiateMpesaPayment);

// M-Pesa callback URL (NO auth)
router.post("/mpesa/callback", paymentController.mpesaCallback);

// MOCK payment success (for demo/testing)
router.post("/mpesa/mock-success", auth, paymentController.mockMpesaSuccess);

module.exports = router;
