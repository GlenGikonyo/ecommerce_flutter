const db = require("../config/db");

exports.createProduct = async (req, res) => {
    const { name, description, price, stock, image_url } = req.body;
  
    if (!name || !price) {
      return res.status(400).json({ message: "Name and price required" });
    }
  
    await db.query(
      "INSERT INTO products (name, description, price, stock, image_url) VALUES (?, ?, ?, ?, ?)",
      [name, description, price, stock, image_url]
    );
  
    res.status(201).json({ message: "Product created successfully" });
  };

exports.getAllProducts = async (req, res) => {
    const [products] = await db.query("SELECT * FROM products");
    res.json(products);
};
  
exports.getProductById = async (req, res) => {
    const { id } = req.params;
  
    const [rows] = await db.query(
      "SELECT * FROM products WHERE id = ?",
      [id]
    );
  
    if (rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
  
    res.json(rows[0]);
};

exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, description, price, stock, image_url } = req.body;
  
    await db.query(
      "UPDATE products SET name=?, description=?, price=?, stock=?, image_url=? WHERE id=?",
      [name, description, price, stock, image_url, id]
    );
  
    res.json({ message: "Product updated" });
};
  
exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
  
    await db.query("DELETE FROM products WHERE id=?", [id]);
  
    res.json({ message: "Product deleted" });
  };
  