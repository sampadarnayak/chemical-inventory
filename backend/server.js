// server.js (ESM)
// Run: node server.js
// Env: DATABASE_URL must be set (Render Postgres external connection string)

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import pkg from "pg";

const { Pool } = pkg;

const app = express();

/* ---------------- CORS (localhost + any *.vercel.app) ---------------- */
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // allow curl / server-to-server
      try {
        const { host, protocol } = new URL(origin);
        const ok =
          origin === "http://localhost:3000" ||
          origin === "http://127.0.0.1:3000" ||
          /\.vercel\.app$/.test(host) ||
          protocol === "capacitor:"; // optional mobile wrapper
        cb(ok ? null : new Error("Not allowed by CORS"), ok);
      } catch {
        cb(new Error("Invalid origin"), false);
      }
    },
    credentials: true,
  })
);

app.use(bodyParser.json());

/* ---------------- PG Pool ---------------- */
if (!process.env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL is not set. Set it in Render → Environment.");
}
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Render PG requires SSL
});

/* ---------------- Helpers ---------------- */
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/* ---------------- Health ---------------- */
app.get("/health", async (_req, res) => {
  try {
    const r = await pool.query("SELECT current_database() db, current_user usr");
    res.json({ ok: true, ...r.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* ---------------- GET: All chemicals ----------------
   Columns (NOTE: no paymentstatus; includes invoice_submitted_on):
   serial_no, name, sku, quantity, total_quantity, consumed, actual_stock,
   receivedon, enduser, vendorname, ponumber, podate, invoiceno, invoicedate,
   invoiceamount, invoice_submitted_on, remarks
----------------------------------------------------- */
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
        invoice_submitted_on,
        remarks
      FROM chemicals
      ORDER BY serial_no ASC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("GET /chemicals error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- GET: One chemical by serial_no ---------------- */
app.get("/chemicals/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const q = `
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
        invoice_submitted_on,
        remarks
      FROM chemicals
      WHERE serial_no = $1
    `;
    const result = await pool.query(q, [id]);
    if (!result.rows.length) return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("GET /chemicals/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- POST: Bulk insert chemicals ----------------
   Expects: { chemicals: [ { ...row }, ... ] }
   Server computes:
     total_quantity = sku * quantity
     actual_stock   = max(0, total_quantity - consumed)
   Behavior:
     - If serial_no is provided, it’s used.
     - If serial_no is missing/empty, DB auto-assigns via DEFAULT.
-------------------------------------------------------------- */
app.post("/chemicals", async (req, res) => {
  try {
    const { chemicals } = req.body;
    if (!Array.isArray(chemicals) || chemicals.length === 0) {
      return res.status(400).json({ error: "chemicals array required" });
    }

    const tasks = chemicals.map((ch) => {
      const sku = num(ch.sku);
      const quantity = num(ch.quantity);
      const consumed = num(ch.consumed);
      const total_quantity = sku * quantity;
      const actual_stock = Math.max(0, total_quantity - consumed);

      const paramsCommon = [
        ch.name ?? null,
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
        ch.invoice_submitted_on || null,
        ch.remarks || null,
      ];

      // If serial_no is provided → include it in the insert
      if (ch.serial_no != null && ch.serial_no !== "") {
        const sql = `
          INSERT INTO chemicals
            (serial_no, name, sku, quantity, total_quantity, consumed, actual_stock,
             receivedon, enduser, vendorname, ponumber, podate, invoiceno, invoicedate,
             invoiceamount, invoice_submitted_on, remarks)
          VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
          RETURNING serial_no
        `;
        const params = [
          ch.serial_no,
          ...paramsCommon,
        ];
        return pool.query(sql, params);
      }

      // No serial_no given → let DB auto-assign
      const sql = `
        INSERT INTO chemicals
          (name, sku, quantity, total_quantity, consumed, actual_stock,
           receivedon, enduser, vendorname, ponumber, podate, invoiceno, invoicedate,
           invoiceamount, invoice_submitted_on, remarks)
        VALUES
          ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
        RETURNING serial_no
      `;
      return pool.query(sql, paramsCommon);
    });

    const results = await Promise.all(tasks);
    const insertedSerials = results
      .map(r => r?.rows?.[0]?.serial_no)
      .filter((v) => v !== undefined && v !== null);

    res.json({ message: "Chemicals added successfully", serials: insertedSerials });
  } catch (err) {
    console.error("POST /chemicals error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- PUT: Update a chemical by serial_no ---------------- */
app.put("/chemicals/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const ch = req.body;

    const sku = num(ch.sku);
    const quantity = num(ch.quantity);
    const consumed = num(ch.consumed);
    const total_quantity = sku * quantity;
    const actual_stock = Math.max(0, total_quantity - consumed);

    const sql = `
      UPDATE chemicals SET
        name=$1,
        sku=$2,
        quantity=$3,
        total_quantity=$4,
        consumed=$5,
        actual_stock=$6,
        receivedon=$7,
        enduser=$8,
        vendorname=$9,
        ponumber=$10,
        podate=$11,
        invoiceno=$12,
        invoicedate=$13,
        invoiceamount=$14,
        invoice_submitted_on=$15,
        remarks=$16
      WHERE serial_no=$17
    `;

    await pool.query(sql, [
      ch.name ?? null,
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
      ch.invoice_submitted_on || null,
      ch.remarks || null,
      id,
    ]);

    res.json({ message: "Chemical updated successfully" });
  } catch (err) {
    console.error("PUT /chemicals/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- DELETE: Remove by serial_no ---------------- */
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

/* ---------------- Start ---------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  const dbHost = (() => {
    try {
      return new URL(process.env.DATABASE_URL).host;
    } catch {
      return "(no DATABASE_URL)";
    }
  })();
  console.log(`Server running on port ${PORT}`);
  console.log(`DB host: ${dbHost}`);
});
