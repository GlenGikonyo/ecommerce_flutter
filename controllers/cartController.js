const db = require("../config/db");

exports.addToCart = async (req, res) => {
    const userId = req.user.id;
    const { productId, quantity } = req.body;
  
    // 1. Find or create cart
    let [cart] = await db.query(
      "SELECT * FROM carts WHERE user_id = ?",
      [userId]
    );
  
    if (cart.length === 0) {
      await db.query(
        "INSERT INTO carts (user_id) VALUES (?)",
        [userId]
      );
  
      [cart] = await db.query(
        "SELECT * FROM carts WHERE user_id = ?",
        [userId]
      );
    }
  
    const cartId = cart[0].id;
  
    // 2. Check if product exists in cart
    const [existingItem] = await db.query(
      "SELECT * FROM cart_items WHERE cart_id=? AND product_id=?",
      [cartId, productId]
    );
  
    if (existingItem.length > 0) {
      await db.query(
        "UPDATE cart_items SET quantity = quantity + ? WHERE id = ?",
        [quantity, existingItem[0].id]
      );
    } else {
      await db.query(
        "INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)",
        [cartId, productId, quantity]
      );
    }
  
    res.json({ message: "Product added to cart" });
};

exports.getCart = async (req, res) => {
    const userId = req.user.id;
  
    const [cart] = await db.query(
      "SELECT id FROM carts WHERE user_id = ?",
      [userId]
    );
  
    if (cart.length === 0) {
      return res.json([]);
    }
  
    const [items] = await db.query(`
      SELECT 
        p.id,
        p.name,
        p.price,
        c.quantity
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.cart_id = ?
    `, [cart[0].id]);
  
    res.json(items);
};

exports.updateCartItem = async (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.user.id;
  
    const [[cart]] = await db.query(
      "SELECT id FROM carts WHERE user_id=?",
      [userId]
    );
  
    await db.query(
      "UPDATE cart_items SET quantity=? WHERE cart_id=? AND product_id=?",
      [quantity, cart.id, productId]
    );
  
    res.json({ message: "Cart updated" });
};

exports.removeCartItem = async (req, res) => {
    const userId = req.user.id;
    const { productId } = req.params;
  
    const [[cart]] = await db.query(
      "SELECT id FROM carts WHERE user_id=?",
      [userId]
    );
  
    await db.query(
      "DELETE FROM cart_items WHERE cart_id=? AND product_id=?",
      [cart.id, productId]
    );
  
    res.json({ message: "Item removed from cart" });
};
  
  
  