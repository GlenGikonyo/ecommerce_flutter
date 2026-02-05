const axios = require("axios");
const db = require("../config/db");

const BASE_URL = process.env.INTASEND_BASE_URL; // Should be https://payment.intasend.com
const API_KEY = process.env.INTASEND_API_KEY;   

exports.initiateIntaSendPayment = async (req, res) => {
  try {
    const { orderId, amount, email, phone } = req.body;

    if (!orderId || !amount || !email) {
      return res.status(400).json({ message: "orderId, amount and email are required" });
    }

    const apiRef = `ORDER-${orderId}-${Date.now()}`;

    const payload = {
      amount: parseFloat(amount),
      currency: "KES",
      email: email,
      phone_number: phone,
      api_ref: apiRef,
      redirect_url: `${process.env.BACKEND_URL}/payment-success`,
    };

    // ✅ FIXED: Correct endpoint and authentication
    const response = await axios.post(
      `${BASE_URL}/api/v1/checkout/`,  // Added /api/
      payload,
      {
        headers: {
          "Authorization": `Bearer ${API_KEY}`,  // Use secret key, not publishable
          "Content-Type": "application/json"
        }        
      }
    );

    const checkoutUrl = response.data.url;
    const invoiceId = response.data.invoice?.invoice_id || response.data.id;

    // Save pending payment
    await db.query(
      `INSERT INTO payments (order_id, user_id, amount, checkout_request_id, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [orderId, req.user.id, amount, invoiceId, "pending"]
    );

    res.json({
      message: "Checkout link generated",
      checkoutUrl,
      invoiceId
    });

  } catch (err) {
    console.error("Checkout Error:", err.response?.data || err.message);
    res.status(500).json({
      message: "Failed to create checkout link",
      error: err.response?.data || err.message
    });
  }
};


exports.handleIntaSendWebhook = async (req, res) => {
  try {
    console.log("🔥 IntaSend Webhook:", req.body);

    const {
      invoice_id,
      state,               // COMPLETE, FAILED, PENDING
      mpesa_reference,
      api_ref,
      failed_reason,
      value
    } = req.body;

    if (!invoice_id) {
      return res.status(400).json({ error: "Missing invoice_id" });
    }

    // 1️⃣ Update payment record
    const paymentResult = await db.query(
      `UPDATE payments 
       SET status = $1,
           mpesa_receipt = $2,
           updated_at = NOW()
       WHERE checkout_request_id = $3
       RETURNING order_id`,
      [
        state === "COMPLETE" ? "success" :
        state === "FAILED" ? "failed" : "pending",
        mpesa_reference || failed_reason || state,
        invoice_id
      ]
    );

    if (paymentResult.rows.length === 0) {
      console.log("⚠️ Payment not found:", invoice_id);
      return res.sendStatus(200);
    }

    const orderId = paymentResult.rows[0].order_id;

    // 2️⃣ Update order based on payment
    if (state === "COMPLETE") {
      await db.query(
        `UPDATE orders 
         SET payment_status = 'paid', order_status = 'processing'
         WHERE id = $1`,
        [orderId]
      );
      console.log(`✅ Order ${orderId} marked PAID`);
    }

    if (state === "FAILED") {
      await db.query(
        `UPDATE orders 
         SET payment_status = 'failed'
         WHERE id = $1`,
        [orderId]
      );
      console.log(`❌ Order ${orderId} payment FAILED`);
    }

    res.sendStatus(200);

  } catch (err) {
    console.error("Webhook error:", err.message);
    res.sendStatus(500);
  }
};
