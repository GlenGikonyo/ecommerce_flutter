const axios = require("axios");
const db = require("../config/db");

const BASE_URL = process.env.INTASEND_BASE_URL; // https://sandbox.intasend.com/api/
const API_KEY = process.env.INTASEND_API_KEY;   // Your SECRET key

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
      redirect_url: `${process.env.BACKEND_URL}/payment-success`, // where user goes after payment
    };

    const response = await axios.post(
      `${BASE_URL}v1/checkout/`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const checkoutUrl = response.data.url;          // 🔥 PAYMENT LINK
    const invoiceId   = response.data.invoice?.invoice_id;

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
    console.log("IntaSend Webhook Payload:", JSON.stringify(req.body, null, 2));

    // IntaSend sends different fields depending on the webhook type
    const { 
      invoice_id,           // Main transaction identifier
      state,                // Payment state: COMPLETE, FAILED, PENDING
      mpesa_reference,      // M-Pesa receipt number (e.g., QGX1234ABC)
      api_ref,              // Your custom reference (ORDER-123-...)
      failed_reason,
      value                 // Amount paid
    } = req.body;

    if (!invoice_id) {
      console.error("Missing invoice_id in webhook payload");
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    // Map IntaSend states to your payment status
    let paymentStatus = 'pending';
    if (state === 'COMPLETE') {
      paymentStatus = 'success';
    } else if (state === 'FAILED') {
      paymentStatus = 'failed';
    }

    // Update payment record
    const updateResult = await db.query(
      "UPDATE payments SET mpesa_receipt = $1 WHERE checkout_request_id = $2 RETURNING order_id",
      [mpesa_reference || failed_reason || state, invoice_id]
    );

    if (updateResult.rows.length === 0) {
      console.warn(`No payment found for checkout_request_id: ${invoice_id}`);
      return res.status(404).json({ error: "Payment not found" });
    }

    const orderId = updateResult.rows[0].order_id;

    // Update order status if payment is successful
    if (state === 'COMPLETE') {
      await db.query(
        "UPDATE orders SET payment_status = 'paid' WHERE id = $1",
        [orderId]
      );
      console.log(`Order ${orderId} marked as paid. M-Pesa Receipt: ${mpesa_reference}`);
    } else if (state === 'FAILED') {
      await db.query(
        "UPDATE orders SET payment_status = 'failed' WHERE id = $1",
        [orderId]
      );
      console.log(`Order ${orderId} payment failed. Reason: ${failed_reason}`);
    }

    return res.status(200).json({ 
      received: true,
      message: "Webhook processed successfully" 
    });

  } catch (err) {
    console.error("Webhook processing error:", err);
    return res.status(500).json({ 
      message: "Webhook processing failed",
      error: err.message 
    });
  }
};
