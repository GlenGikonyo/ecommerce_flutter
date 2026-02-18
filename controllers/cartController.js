const db = require("../config/db");

// ➕ ADD TO CART
exports.addToCart = async (req, res) => {
  const userId = req.user.id;
  const { productId, quantity } = req.body;

  try {
    // 1️⃣ Find or create cart
    let cartResult = await db.query(
      "SELECT * FROM carts WHERE user_id = $1",
      [userId]
    );

    if (cartResult.rows.length === 0) {
      await db.query("INSERT INTO carts (user_id) VALUES ($1)", [userId]);

      cartResult = await db.query(
        "SELECT * FROM carts WHERE user_id = $1",
        [userId]
      );
    }

    const cartId = cartResult.rows[0].id;

    // 2️⃣ Check if product already in cart
    const existingItem = await db.query(
      "SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2",
      [cartId, productId]
    );

    if (existingItem.rows.length > 0) {
      await db.query(
        "UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2",
        [quantity, existingItem.rows[0].id]
      );
    } else {
      await db.query(
        "INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)",
        [cartId, productId, quantity]
      );
    }

    res.json({ message: "Product added to cart" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add to cart" });
  }
};


// 🛍 GET CART
exports.getCart = async (req, res) => {
  const userId = req.user.id;

  try {
    const cartResult = await db.query(
      "SELECT id FROM carts WHERE user_id = $1",
      [userId]
    );

    if (cartResult.rows.length === 0) {
      return res.json([]);
    }

    const cartId = cartResult.rows[0].id;

    const items = await db.query(`
      SELECT 
        p.id,
        p.name,
        p.price,
        c.quantity
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.cart_id = $1
    `, [cartId]);

    res.json(items.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch cart" });
  }
};


// 🔄 UPDATE CART ITEM
exports.updateCartItem = async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user.id;

  try {
    const cart = await db.query(
      "SELECT id FROM carts WHERE user_id = $1",
      [userId]
    );

    await db.query(
      "UPDATE cart_items SET quantity = $1 WHERE cart_id = $2 AND product_id = $3",
      [quantity, cart.rows[0].id, productId]
    );

    res.json({ message: "Cart updated" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update cart" });
  }
};


// ❌ REMOVE CART ITEM
exports.removeCartItem = async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;

  try {
    const cart = await db.query(
      "SELECT id FROM carts WHERE user_id = $1",
      [userId]
    );

    await db.query(
      "DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2",
      [cart.rows[0].id, productId]
    );

    res.json({ message: "Item removed from cart" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to remove item" });
  }
};
