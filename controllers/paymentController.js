const db = require("../config/db");
// const axios = require("axios");

// 1️⃣ INITIATE STK PUSH
exports.initiateMpesaPayment = async (req, res) => {
  try {
    const { order_id, phone, amount } = req.body;

    // Save payment as pending
    const [result] = await db.query(
      "INSERT INTO payments (order_id, user_id, phone, amount, status) VALUES (?, ?, ?, ?, 'pending')",
      [order_id, req.user.id, phone, amount]
    );

    // For MVP: pretend STK was sent
    res.json({
      message: "STK push sent to phone",
      payment_id: result.insertId
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Payment initiation failed" });
  }
};

exports.mpesaCallback = async (req, res) => {
    try {
      const callbackData = req.body;
  
      const resultCode =
        callbackData.Body.stkCallback.ResultCode;
  
      if (resultCode === 0) {
        const metadata =
          callbackData.Body.stkCallback.CallbackMetadata.Item;
  
        const receipt = metadata.find(i => i.Name === "MpesaReceiptNumber").Value;
        const amount = metadata.find(i => i.Name === "Amount").Value;
        const phone = metadata.find(i => i.Name === "PhoneNumber").Value;
  
        // Update payment
        await db.query(
          "UPDATE payments SET status='success', mpesa_receipt=? WHERE phone=? AND amount=?",
          [receipt, phone, amount]
        );
  
        // Update order
        await db.query(
          "UPDATE orders SET payment_status='paid', mpesa_receipt=? WHERE id=(SELECT order_id FROM payments WHERE mpesa_receipt=?)",
          [receipt, receipt]
        );
      }
  
      res.json({ message: "Callback received" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Callback error" });
    }
};

exports.mockMpesaSuccess = async (req, res) => {
    try {
      const { order_id, mpesa_receipt } = req.body;
  
      // Update payment
      await db.query(
        "UPDATE payments SET status='success', mpesa_receipt=? WHERE order_id=?",
        [mpesa_receipt, order_id]
      );
  
      // Update order
      await db.query(
        "UPDATE orders SET payment_status='paid', mpesa_receipt=? WHERE id=?",
        [mpesa_receipt, order_id]
      );
  
      res.json({ message: "Mock payment successful" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Mock payment failed" });
    }
  };
  
  