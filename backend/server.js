// server.js (ESM)
// Run: node server.js
// Env: SUPABASE keys must be set in Vercel or .env.local

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

// ---------------- REPLACE pg WITH SUPABASE ----------------
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // server-only secret
const supabase = createClient(supabaseUrl, supabaseKey);
// ---------------------------------------------------------

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

/* ---------------- Helpers ---------------- */
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/* ---------------- Health ---------------- */
app.get("/health", async (_req, res) => {
  try {
    // Supabase doesn’t have current_user like Postgres, so just ping a simple query
    const { data, error } = await supabase.from("chemicals").select("serial_no").limit(1);
    if (error) throw error;
    res.json({ ok: true, sample: data[0] || null });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* ---------------- GET: All chemicals ---------------- */
app.get("/chemicals", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("chemicals")
      .select("*")
      .order("serial_no", { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("GET /chemicals error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- GET: One chemical by serial_no ---------------- */
app.get("/chemicals/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("chemicals")
      .select("*")
      .eq("serial_no", id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("GET /chemicals/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- POST: Bulk insert chemicals ---------------- */
app.post("/chemicals", async (req, res) => {
  try {
    const { chemicals } = req.body;
    if (!Array.isArray(chemicals) || chemicals.length === 0) {
      return res.status(400).json({ error: "chemicals array required" });
    }

    const rows = chemicals.map((ch) => {
      const sku = num(ch.sku);
      const quantity = num(ch.quantity);
      const consumed = num(ch.consumed);
      return {
        name: ch.name || null,
        sku,
        quantity,
        total_quantity: sku * quantity,
        consumed,
        actual_stock: Math.max(0, sku * quantity - consumed),
        receivedon: ch.receivedon || null,
        enduser: ch.enduser || null,
        vendorname: ch.vendorname || null,
        ponumber: ch.ponumber || null,
        podate: ch.podate || null,
        invoiceno: ch.invoiceno || null,
        invoicedate: ch.invoicedate || null,
        invoiceamount: ch.invoiceamount ?? null,
        invoice_submitted_on: ch.invoice_submitted_on || null,
        remarks: ch.remarks || null,
      };
    });

    const { data, error } = await supabase.from("chemicals").insert(rows).select("serial_no");
    if (error) throw error;

    res.json({ message: "Chemicals added successfully", serials: data.map(d => d.serial_no) });
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

    const { data, error } = await supabase
      .from("chemicals")
      .update({
        name: ch.name ?? null,
        sku,
        quantity,
        total_quantity: sku * quantity,
        consumed,
        actual_stock: Math.max(0, sku * quantity - consumed),
        receivedon: ch.receivedon || null,
        enduser: ch.enduser || null,
        vendorname: ch.vendorname || null,
        ponumber: ch.ponumber || null,
        podate: ch.podate || null,
        invoiceno: ch.invoiceno || null,
        invoicedate: ch.invoicedate || null,
        invoiceamount: ch.invoiceamount ?? null,
        invoice_submitted_on: ch.invoice_submitted_on || null,
        remarks: ch.remarks || null,
      })
      .eq("serial_no", id);
    if (error) throw error;

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
    const { error } = await supabase.from("chemicals").delete().eq("serial_no", id);
    if (error) throw error;
    res.json({ message: "Chemical deleted successfully" });
  } catch (err) {
    console.error("DELETE /chemicals/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- Start ---------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Supabase URL: ${process.env.SUPABASE_URL}`);
});