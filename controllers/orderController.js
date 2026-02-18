const db = require("../config/db");

// 📦 PLACE ORDER
exports.placeOrder = async (req, res) => {
  const userId = req.user.id;

  try {
    const cartResult = await db.query(
      "SELECT id FROM carts WHERE user_id = $1",
      [userId]
    );

    if (cartResult.rows.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const cartId = cartResult.rows[0].id;

    const itemsResult = await db.query(`
      SELECT p.id, p.price, c.quantity
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.cart_id = $1
    `, [cartId]);

    if (itemsResult.rows.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let total = 0;
    itemsResult.rows.forEach(item => {
      total += item.price * item.quantity;
    });

    const orderResult = await db.query(
      "INSERT INTO orders (user_id, total, status) VALUES ($1, $2, 'PENDING') RETURNING id",
      [userId, total]
    );

    const orderId = orderResult.rows[0].id;

    for (let item of itemsResult.rows) {
      await db.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)",
        [orderId, item.id, item.quantity, item.price]
      );
    }

    await db.query("DELETE FROM cart_items WHERE cart_id = $1", [cartId]);

    res.status(201).json({ message: "Order placed successfully", orderId });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Order placement failed" });
  }
};

exports.getMyOrders = async (req, res) => {
  const userId = req.user.id;

  const result = await db.query(
    "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
    [userId]
  );

  res.json(result.rows);
};

exports.getAllOrders = async (req, res) => {
  const result = await db.query(
    "SELECT * FROM orders ORDER BY created_at DESC"
  );

  res.json(result.rows);
};

exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  await db.query(
    "UPDATE orders SET status = $1 WHERE id = $2",
    [status, id]
  );

  res.json({ message: "Order status updated" });
};
