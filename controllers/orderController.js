const db = require("../config/db");

exports.placeOrder = async (req, res) => {
    const userId = req.user.id;
  
    // 1. Get cart
    const [[cart]] = await db.query(
      "SELECT id FROM carts WHERE user_id=?",
      [userId]
    );
  
    if (!cart) {
      return res.status(400).json({ message: "Cart is empty" });
    }
  
    // 2. Get cart items
    const [items] = await db.query(`
      SELECT 
        p.id,
        p.price,
        c.quantity
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.cart_id = ?
    `, [cart.id]);
  
    if (items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }
  
    // 3. Calculate total
    let total = 0;
    items.forEach(item => {
      total += item.price * item.quantity;
    });
  
    // 4. Create order
    const [orderResult] = await db.query(
      "INSERT INTO orders (user_id, total) VALUES (?, ?)",
      [userId, total]
    );
  
    const orderId = orderResult.insertId;
  
    // 5. Insert order items
    for (let item of items) {
      await db.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
        [orderId, item.id, item.quantity, item.price]
      );
    }
  
    // 6. Clear cart
    await db.query("DELETE FROM cart_items WHERE cart_id=?", [cart.id]);
  
    res.status(201).json({
      message: "Order placed successfully",
      orderId
    });
};

exports.getMyOrders = async (req, res) => {
    const userId = req.user.id;
  
    const [orders] = await db.query(
      "SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC",
      [userId]
    );
  
    res.json(orders);
};

exports.getAllOrders = async (req, res) => {
    const [orders] = await db.query(
      "SELECT * FROM orders ORDER BY created_at DESC"
    );
  
    res.json(orders);
};

exports.updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
  
    await db.query(
      "UPDATE orders SET status=? WHERE id=?",
      [status, id]
    );
  
    res.json({ message: "Order status updated" });
  };
  
  
  
  