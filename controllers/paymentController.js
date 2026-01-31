const axios = require("axios");
const db = require("../config/db");

const BASE_URL = process.env.INTASEND_BASE_URL;
const API_KEY = process.env.INTASEND_API_KEY;

exports.initiateIntaSendPayment = async (req, res) => {
  try {
    const { orderId, amount, phone, email } = req.body;

    if (!orderId || !amount || !phone || !email) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const payload = {
      amount,
      currency: "KES",
      email,
      phone,
      order_ref: `ORDER-${orderId}-${Date.now()}`, // unique reference
      callback_url: `${process.env.BACKEND_URL}/api/payments/intasend/webhook`
    };

    // Hit sandbox API
    const response = await axios.post(`${BASE_URL}payments`, payload, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    // Save payment in DB (optional)
    await db.query(
      "INSERT INTO payments (order_id, user_id, amount, status, payment_reference) VALUES ($1, $2, $3, $4, $5)",
      [orderId, req.user.id, amount, "pending", response.data.payment_reference]
    );

    return res.json({
      message: "Payment initiated",
      paymentLink: response.data.checkout_url
    });

  } catch (err) {
    console.error("IntaSend Init Error:", err.response?.data || err.message);
    return res.status(500).json({ message: "Payment initiation failed" });
  }
};

exports.handleIntaSendWebhook = async (req, res) => {
  try {
    const { payment_reference, status } = req.body;

    await db.query(
      "UPDATE payments SET status = $1 WHERE payment_reference = $2",
      [status, payment_reference]
    );

    if (status === "success") {
      await db.query(
        `UPDATE orders SET payment_status = 'paid'
         WHERE id = (SELECT order_id FROM payments WHERE payment_reference = $1)`,
        [payment_reference]
      );
    }

    res.json({ received: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Webhook processing failed" });
  }
};
