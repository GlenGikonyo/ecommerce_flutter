const db = require("../config/db");

exports.createProduct = async (req, res) => {
  const { name, description, price, stock, image_url } = req.body;

  if (!name || !price) {
    return res.status(400).json({ message: "Name and price required" });
  }

  await db.query(
    `INSERT INTO products (name, description, price, stock, image_url)
     VALUES ($1, $2, $3, $4, $5)`,
    [name, description, price, stock, image_url]
  );

  res.status(201).json({ message: "Product created successfully" });
};

exports.getAllProducts = async (req, res) => {
  const result = await db.query("SELECT * FROM products ORDER BY created_at DESC");
  res.json(result.rows);
};

exports.getProductById = async (req, res) => {
  const { id } = req.params;

  const result = await db.query("SELECT * FROM products WHERE id = $1", [id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json(result.rows[0]);
};

exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, image_url } = req.body;

  await db.query(
    `UPDATE products
     SET name=$1, description=$2, price=$3, stock=$4, image_url=$5
     WHERE id=$6`,
    [name, description, price, stock, image_url, id]
  );

  res.json({ message: "Product updated" });
};

exports.deleteProduct = async (req, res) => {
  const { id } = req.params;

  await db.query("DELETE FROM products WHERE id=$1", [id]);

  res.json({ message: "Product deleted" });
};
