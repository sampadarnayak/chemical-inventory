import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import pkg from "pg";

const { Pool } = pkg;

const app = express();

// If you know your frontend origins, list them here.
// For dev, localhost:3000 is enough. You can relax to app.use(cors()) if you prefer.
app.use(cors({
  origin: ["http://localhost:3000"],
  credentials: true,
}));
app.use(bodyParser.json());

// ---- PostgreSQL pool (Render external connection via .env) ----
if (!process.env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL is not set. Create backend/.env with DATABASE_URL=...");
}
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Render external Postgres requires SSL
  ssl: { rejectUnauthorized: false },
});

// Utility
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

// ---- Health check (optional but handy) ----
app.get("/health", async (req, res) => {
  try {
    const r = await pool.query("SELECT current_database() AS db, current_user AS usr");
    res.json({ ok: true, db: r.rows[0].db, user: r.rows[0].usr });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ---- Get ALL chemicals ----
app.get("/chemicals", async (_req, res) => {
  try {
    const query = `
      SELECT
        serial_no,
        name,
        sku,
        quantity,
        total_quantity,
        consumed,
        actual_stock,
        receivedon,
        enduser,
        vendorname,
        ponumber,
        podate,
        invoiceno,
        invoicedate,
        invoiceamount,
        paymentstatus,
        remarks
      FROM chemicals
      ORDER BY serial_no ASC
    `;
    const result = await pool.query(query);

    // Debug a sample row once:
    if (result.rows[0]) {
      console.log("Sample row keys:", Object.keys(result.rows[0]));
    }

    res.json(result.rows);
  } catch (err) {
    console.error("GET /chemicals error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---- Get ONE chemical by serial_no ----
app.get("/chemicals/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT
         serial_no, name, sku, quantity, total_quantity, consumed, actual_stock,
         receivedon, enduser, vendorname, ponumber, podate, invoiceno,
         invoicedate, invoiceamount, paymentstatus, remarks
       FROM chemicals
       WHERE serial_no = $1`,
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("GET /chemicals/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---- Add new chemicals (multiple rows) ----
app.post("/chemicals", async (req, res) => {
  try {
    const { chemicals } = req.body;
    if (!Array.isArray(chemicals) || chemicals.length === 0) {
      return res.status(400).json({ error: "chemicals array required" });
    }

    const insertPromises = chemicals.map((ch) => {
      const sku = num(ch.sku);
      const quantity = num(ch.quantity);
      const consumed = num(ch.consumed);
      const total_quantity = sku * quantity;
      const actual_stock = Math.max(0, total_quantity - consumed);

      return pool.query(
        `INSERT INTO chemicals 
          (serial_no, name, sku, quantity, total_quantity, consumed, actual_stock,
           receivedon, enduser, vendorname, ponumber, podate, invoiceno, invoicedate,
           invoiceamount, paymentstatus, remarks)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [
          ch.serial_no,
          ch.name,
          sku,
          quantity,
          total_quantity,
          consumed,
          actual_stock,
          ch.receivedon || null,
          ch.enduser || null,
          ch.vendorname || null,
          ch.ponumber || null,
          ch.podate || null,
          ch.invoiceno || null,
          ch.invoicedate || null,
          ch.invoiceamount ?? null,
          ch.paymentstatus || null,
          ch.remarks || null,
        ]
      );
    });

    await Promise.all(insertPromises);
    res.json({ message: "Chemicals added successfully" });
  } catch (err) {
    console.error("POST /chemicals error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---- Update chemical by serial_no ----
app.put("/chemicals/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const ch = req.body;

    const sku = num(ch.sku);
    const quantity = num(ch.quantity);
    const consumed = num(ch.consumed);
    const total_quantity = sku * quantity;
    const actual_stock = Math.max(0, total_quantity - consumed);

    await pool.query(
      `UPDATE chemicals SET 
         name=$1, sku=$2, quantity=$3, total_quantity=$4, consumed=$5, actual_stock=$6, 
         receivedon=$7, enduser=$8, vendorname=$9, ponumber=$10, podate=$11, 
         invoiceno=$12, invoicedate=$13, invoiceamount=$14, paymentstatus=$15, remarks=$16
       WHERE serial_no=$17`,
      [
        ch.name,
        sku,
        quantity,
        total_quantity,
        consumed,
        actual_stock,
        ch.receivedon || null,
        ch.enduser || null,
        ch.vendorname || null,
        ch.ponumber || null,
        ch.podate || null,
        ch.invoiceno || null,
        ch.invoicedate || null,
        ch.invoiceamount ?? null,
        ch.paymentstatus || null,
        ch.remarks || null,
        id,
      ]
    );
    res.json({ message: "Chemical updated successfully" });
  } catch (err) {
    console.error("PUT /chemicals/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---- Delete chemical ----
app.delete("/chemicals/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM chemicals WHERE serial_no = $1", [id]);
    res.json({ message: "Chemical deleted successfully" });
  } catch (err) {
    console.error("DELETE /chemicals/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---- Start server ----
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  const host = (() => {
    try { return new URL(process.env.DATABASE_URL).host; } catch { return "(no DATABASE_URL)"; }
  })();
  console.log(`Server running on port ${PORT}`);
  console.log(`DB host: ${host}`);
});
