require('dotenv').config(); // <-- must be first
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Database connection (Render Postgres)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ✅ Login route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1 AND password = $2",
      [username, password]
    );
    if (result.rows.length > 0) {
      res.json({ success: true, token: "dummy-token" }); // later replace with JWT
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

// ✅ Change password route
app.post("/change-password", async (req, res) => {
  const { username, newPassword } = req.body;
  try {
    await pool.query(
      "UPDATE users SET password = $1 WHERE username = $2",
      [newPassword, username]
    );
    res.json({ success: true, message: "Password updated" });
  } catch (err) {
    res.status(500).send(err);
  }
});

// ✅ Fetch all chemicals
app.get("/chemicals", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM chemicals");

    // 🔄 Map DB columns to frontend-friendly keys
    const formatted = result.rows.map(row => ({
      sl_no: row.serial_no,
      name: row.name,                 
      chemical_name: row.name,   // ✅ FIXED here
      sku: row.sku,
      quantity: row.quantity,
      consumed: row.consumed,
      total_quantity: row.total_quantity,
      actual_stock: row.actual_stock
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).send(err);
  }
});

// ✅ Add a chemical (auto-calculate serial_no, total_quantity, actual_stock)
app.post("/chemicals", async (req, res) => {
  const { name, sku, quantity } = req.body;

  // Function to parse sku (e.g., "500g", "1kg", "3 ampules", "500ml")
  function parseSku(sku) {
    if (!sku) return null;

    const str = sku.toLowerCase().trim();
    let value = parseFloat(str);

    if (str.includes("kg")) {
      return value * 1000; // convert kg → grams
    } else if (str.includes("g")) {
      return value; // grams
    } else if (str.includes("ml")) {
      return value; // ml
    } else if (str.includes("ampule") || str.includes("ampules")) {
      return value; // count of ampules
    } else {
      return isNaN(value) ? null : value; // fallback numeric
    }
  }

  const parsedSku = parseSku(sku);
  const total_quantity = parsedSku !== null ? parsedSku * quantity : null;
  const consumed = 0;
  const actual_stock = total_quantity !== null ? total_quantity - consumed : null;

  try {
    // generate serial_no dynamically
    const countResult = await pool.query("SELECT COUNT(*) FROM chemicals");
    const serial_no = parseInt(countResult.rows[0].count) + 1;

    const insertResult = await pool.query(
      `INSERT INTO chemicals 
       (serial_no, name, sku, quantity, total_quantity, consumed, actual_stock) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [serial_no, name, sku, quantity, total_quantity, consumed, actual_stock]
    );

    res.json({ success: true, id: insertResult.rows[0].id });
  } catch (err) {
    console.error("❌ Error inserting chemical:", err);
    res.status(500).send(err);
  }
});

// ✅ Delete a chemical
app.delete("/chemicals/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM chemicals WHERE id = $1", [id]);
    res.json({ success: true, message: "Chemical deleted" });
  } catch (err) {
    res.status(500).send(err);
  }
});

// ✅ Start server (Render uses PORT env var)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
