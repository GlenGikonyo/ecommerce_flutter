const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const paymentController = require("../controllers/paymentController");

// Initiate a payment
router.post("/intasend/initiate", auth, paymentController.initiateIntaSendPayment);

// IntaSend webhook (no auth, IntaSend server calls this)
router.post("/intasend/webhook", paymentController.handleIntaSendWebhook);

module.exports = router;
