import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "./config";
import "./styles/Form.css";

/**
 * FormPage
 *
 * Handles adding new chemicals or editing existing PO with chemicals.
 */

function safeNum(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function FormPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const chemicalToEdit = location.state?.chemicalToEdit || null;

  const [poFields, setPoFields] = useState({
    ponumber: "",
    podate: "",
    vendorname: "",
    enduser: "",
    invoiceno: "",
    invoicedate: "",
    invoiceamount: "",
    invoice_submitted_on: "",
    remarks: "",
    receivedon: "",
  });

  const [rows, setRows] = useState([
    {
      serial_no: "",
      name: "",
      sku: "",
      quantity: "",
      total_quantity: 0,
      consumed: 0,
      actual_stock: 0,
      receivedon: "",
      enduser: "",
      vendorname: "",
      ponumber: "",
      podate: "",
      invoiceno: "",
      invoicedate: "",
      invoiceamount: "",
      invoice_submitted_on: "",
      remarks: "",
    },
  ]);

  const [initialSerials, setInitialSerials] = useState([]);
  const [isPoEditMode, setIsPoEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchAllChemicals = async () => {
    const resp = await axios.get(`${API_BASE_URL}/chemicals`);
    return resp.data || [];
  };

  useEffect(() => {
    async function initEdit() {
      if (!chemicalToEdit) return;

      const po = chemicalToEdit.ponumber;
      if (po) {
        setLoading(true);
        try {
          const all = await fetchAllChemicals();
          const samePo = all.filter((c) => (c.ponumber || "") === po);

          if (samePo.length > 0) {
            const mapped = samePo.map((c) => ({
              serial_no: c.serial_no ?? "",
              name: c.name ?? "",
              sku: c.sku ?? "",
              quantity: c.quantity ?? "",
              total_quantity:
                c.total_quantity ?? safeNum(c.sku) * safeNum(c.quantity),
              consumed: c.consumed ?? 0,
              actual_stock:
                c.actual_stock ??
                safeNum(c.sku) * safeNum(c.quantity) - safeNum(c.consumed),
              receivedon: c.receivedon
                ? new Date(c.receivedon).toISOString().split("T")[0]
                : "",
              enduser: c.enduser ?? "",
              vendorname: c.vendorname ?? "",
              ponumber: c.ponumber ?? "",
              podate: c.podate
                ? new Date(c.podate).toISOString().split("T")[0]
                : "",
              invoiceno: c.invoiceno ?? "",
              invoicedate: c.invoicedate
                ? new Date(c.invoicedate).toISOString().split("T")[0]
                : "",
              invoiceamount: c.invoiceamount ?? "",
              invoice_submitted_on: c.invoice_submitted_on
                ? new Date(c.invoice_submitted_on)
                    .toISOString()
                    .split("T")[0]
                : "",
              remarks: c.remarks ?? "",
            }));

            const first = mapped[0];
            setPoFields({
              ponumber: first.ponumber || "",
              podate: first.podate || "",
              vendorname: first.vendorname || "",
              enduser: first.enduser || "",
              invoiceno: first.invoiceno || "",
              invoicedate: first.invoicedate || "",
              invoiceamount: first.invoiceamount || "",
              invoice_submitted_on: first.invoice_submitted_on || "",
              remarks: first.remarks || "",
              receivedon: first.receivedon || "",
            });

            setRows(mapped);
            setInitialSerials(mapped.map((r) => r.serial_no).filter(Boolean));
            setIsPoEditMode(true);
          } else {
            prefillSingle(chemicalToEdit);
          }
        } catch (err) {
          console.error("Error loading chemicals for PO:", err);
          prefillSingle(chemicalToEdit);
        } finally {
          setLoading(false);
        }
      } else {
        prefillSingle(chemicalToEdit);
      }
    }

    function prefillSingle(c) {
      setPoFields((prev) => ({
        ...prev,
        ponumber: c.ponumber || prev.ponumber,
        podate: c.podate
          ? new Date(c.podate).toISOString().split("T")[0]
          : prev.podate,
        vendorname: c.vendorname || prev.vendorname,
        enduser: c.enduser || prev.enduser,
        invoiceno: c.invoiceno || prev.invoiceno,
        invoicedate: c.invoicedate
          ? new Date(c.invoicedate).toISOString().split("T")[0]
          : prev.invoicedate,
        invoiceamount: c.invoiceamount || prev.invoiceamount,
        invoice_submitted_on: c.invoice_submitted_on
          ? new Date(c.invoice_submitted_on).toISOString().split("T")[0]
          : prev.invoice_submitted_on,
        remarks: c.remarks || prev.remarks,
        receivedon: c.receivedon
          ? new Date(c.receivedon).toISOString().split("T")[0]
          : prev.receivedon,
      }));

      const mapped = {
        serial_no: c.serial_no ?? "",
        name: c.name ?? "",
        sku: c.sku ?? "",
        quantity: c.quantity ?? "",
        total_quantity:
          c.total_quantity ?? safeNum(c.sku) * safeNum(c.quantity),
        consumed: c.consumed ?? 0,
        actual_stock:
          c.actual_stock ??
          safeNum(c.sku) * safeNum(c.quantity) - safeNum(c.consumed),
        receivedon: c.receivedon
          ? new Date(c.receivedon).toISOString().split("T")[0]
          : "",
        enduser: c.enduser ?? "",
        vendorname: c.vendorname ?? "",
        ponumber: c.ponumber ?? "",
        podate: c.podate
          ? new Date(c.podate).toISOString().split("T")[0]
          : "",
        invoiceno: c.invoiceno ?? "",
        invoicedate: c.invoicedate
          ? new Date(c.invoicedate).toISOString().split("T")[0]
          : "",
        invoiceamount: c.invoiceamount ?? "",
        invoice_submitted_on: c.invoice_submitted_on
          ? new Date(c.invoice_submitted_on).toISOString().split("T")[0]
          : "",
        remarks: c.remarks ?? "",
      };
      setRows([mapped]);
      setInitialSerials(mapped.serial_no ? [mapped.serial_no] : []);
      setIsPoEditMode(Boolean(mapped.ponumber));
    }

    initEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chemicalToEdit]);

  const addRow = () => {
    setRows((r) =>
      r.concat([
        {
          serial_no: "",
          name: "",
          sku: "",
          quantity: "",
          total_quantity: 0,
          consumed: 0,
          actual_stock: 0,
          receivedon: poFields.receivedon || "",
          enduser: poFields.enduser || "",
          vendorname: poFields.vendorname || "",
          ponumber: poFields.ponumber || "",
          podate: poFields.podate || "",
          invoiceno: poFields.invoiceno || "",
          invoicedate: poFields.invoicedate || "",
          invoiceamount: poFields.invoiceamount || "",
          invoice_submitted_on: poFields.invoice_submitted_on || "",
          remarks: poFields.remarks || "",
        },
      ])
    );
  };

  const removeRow = (idx) => {
    setRows((r) => r.filter((_, i) => i !== idx));
  };

  const updateRowField = (idx, field, value) => {
    setRows((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[idx][field] = value;

      const sku = safeNum(copy[idx].sku);
      const quantity = safeNum(copy[idx].quantity);
      const consumed = safeNum(copy[idx].consumed);

      copy[idx].total_quantity = sku * quantity;
      copy[idx].actual_stock = Math.max(0, sku * quantity - consumed);

      // sync PO-level fields into each row
      copy[idx].ponumber = poFields.ponumber;
      copy[idx].podate = poFields.podate;
      copy[idx].vendorname = poFields.vendorname;
      copy[idx].enduser = poFields.enduser;
      copy[idx].invoiceno = poFields.invoiceno;
      copy[idx].invoicedate = poFields.invoicedate;
      copy[idx].invoiceamount = poFields.invoiceamount;
      copy[idx].invoice_submitted_on = poFields.invoice_submitted_on;
      copy[idx].remarks = poFields.remarks;
      copy[idx].receivedon = copy[idx].receivedon || poFields.receivedon;

      return copy;
    });
  };

  const handlePoFieldChange = (field, value) => {
    setPoFields((prev) => {
      const next = { ...prev, [field]: value };
      setRows((prevRows) =>
        prevRows.map((r) => ({
          ...r,
          ponumber: next.ponumber,
          podate: next.podate,
          vendorname: next.vendorname,
          enduser: next.enduser,
          invoiceno: next.invoiceno,
          invoicedate: next.invoicedate,
          invoiceamount: next.invoiceamount,
          invoice_submitted_on: next.invoice_submitted_on,
          remarks: next.remarks,
          receivedon: r.receivedon || next.receivedon,
        }))
      );
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payloadRows = rows.map((r) => {
        const sku = safeNum(r.sku);
        const quantity = safeNum(r.quantity);
        const consumed = safeNum(r.consumed);
        return {
          serial_no: r.serial_no,
          name: r.name,
          sku,
          quantity,
          total_quantity: sku * quantity,
          consumed,
          actual_stock: Math.max(0, sku * quantity - consumed),
          receivedon: r.receivedon || poFields.receivedon || null,
          enduser: r.enduser || poFields.enduser || null,
          vendorname: r.vendorname || poFields.vendorname || null,
          ponumber: r.ponumber || poFields.ponumber || null,
          podate: r.podate || poFields.podate || null,
          invoiceno: r.invoiceno || poFields.invoiceno || null,
          invoicedate: r.invoicedate || poFields.invoicedate || null,
          invoiceamount: r.invoiceamount || poFields.invoiceamount || null,
          invoice_submitted_on:
            r.invoice_submitted_on || poFields.invoice_submitted_on || null,
          remarks: r.remarks || poFields.remarks || null,
        };
      });

      if (!isPoEditMode) {
        await axios.post(`${API_BASE_URL}/chemicals`, { chemicals: payloadRows });
        alert("Chemicals saved");
        navigate("/list");
        return;
      }

      const currentSerials = payloadRows
        .map((r) => (r.serial_no ? r.serial_no.toString() : null))
        .filter(Boolean);
      const toDelete = initialSerials.filter(
        (s) => !currentSerials.includes(String(s))
      );

      await Promise.allSettled(
        toDelete.map((s) => axios.delete(`${API_BASE_URL}/chemicals/${s}`))
      );

      const updatePromises = payloadRows
        .filter((r) => r.serial_no && initialSerials.includes(Number(r.serial_no)))
        .map((r) => axios.put(`${API_BASE_URL}/chemicals/${r.serial_no}`, r));

      const newRows = payloadRows.filter(
        (r) => !r.serial_no || !initialSerials.includes(Number(r.serial_no))
      );

      await Promise.allSettled(updatePromises);

      if (newRows.length > 0) {
        await axios.post(`${API_BASE_URL}/chemicals`, { chemicals: newRows });
      }

      alert("PO update completed");
      navigate("/list");
    } catch (err) {
      console.error("Error saving chemicals:", err);
      alert("Error saving chemicals. Check console.");
    }
  };

  return (
    <div className="form-container p-6 mx-auto bg-white/80 backdrop-blur rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">
        {isPoEditMode ? "Edit PO & Chemicals" : "Add Chemical(s)"}
      </h2>

      <form onSubmit={handleSubmit}>
        {/* PO-level fields */}
        <div className="po-section mb-4 grid grid-cols-2 gap-3">
          <input
            name="ponumber"
            placeholder="PO Number"
            value={poFields.ponumber}
            onChange={(e) => handlePoFieldChange("ponumber", e.target.value)}
            className="p-2 border rounded"
            required
          />
          <div className="col-span-1">
  <input
    type="text"
    placeholder="PO Date"
    value={poFields.podate}
    onChange={(e) => handlePoFieldChange("podate", e.target.value)}
    onFocus={(e) => (e.target.type = "date")}
    onBlur={(e) => (e.target.type = "text")}
    className="p-2 border rounded w-full"
  />
</div>
          <input
            name="vendorname"
            placeholder="Vendor Name"
            value={poFields.vendorname}
            onChange={(e) => handlePoFieldChange("vendorname", e.target.value)}
            className="p-2 border rounded"
          />
          <input
            name="enduser"
            placeholder="End User"
            value={poFields.enduser}
            onChange={(e) => handlePoFieldChange("enduser", e.target.value)}
            className="p-2 border rounded"
          />
          <input
            name="invoiceno"
            placeholder="Invoice No"
            value={poFields.invoiceno}
            onChange={(e) => handlePoFieldChange("invoiceno", e.target.value)}
            className="p-2 border rounded"
          />
          <div className="col-span-1">
  <input
    type="text"
    placeholder="Invoice Date"
    value={poFields.invoicedate}
    onChange={(e) => handlePoFieldChange("invoicedate", e.target.value)}
    onFocus={(e) => (e.target.type = "date")}
    onBlur={(e) => (e.target.type = "text")}
    className="p-2 border rounded w-full"
  />
</div>
          <input
            name="invoiceamount"
            placeholder="Invoice Amount"
            value={poFields.invoiceamount}
            onChange={(e) => handlePoFieldChange("invoiceamount", e.target.value)}
            className="p-2 border rounded"
          />
          <div className="col-span-1">
  <input
    type="text"
    placeholder="Invoice Submitted On"
    value={poFields.invoice_submitted_on}
    onChange={(e) => handlePoFieldChange("invoice_submitted_on", e.target.value)}
    onFocus={(e) => (e.target.type = "date")}
    onBlur={(e) => (e.target.type = "text")}
    className="p-2 border rounded w-full"
  />
</div>
          
          <input
            name="remarks"
            placeholder="Remarks"
            value={poFields.remarks}
            onChange={(e) => handlePoFieldChange("remarks", e.target.value)}
            className="p-2 border rounded col-span-2"
          />
        </div>

        {/* Chemical rows header */}
        <div className="rows-header grid grid-cols-12 gap-4 px-2 py-1 font-medium text-sm">
          <div className="col-span-1">SL</div>
          <div className="col-span-3">Chemical Name</div>
          <div className="col-span-1">SKU(g/ml)</div>
          <div className="col-span-1">Quantity</div>
          <div className="col-span-1">Total Quantity</div>
          <div className="col-span-1">Consumed</div>
          <div className="col-span-1">Actual Stock</div>
          <div className="col-span-2">Received On</div>
          <div className="col-span-1">Remove</div>
        </div>

        {/* Rows */}
        {rows.map((r, idx) => (
          <div
            key={idx}
            className="row grid grid-cols-12 gap-4 items-center px-2 py-2 border-b"
          >
            <div className="col-span-1">
              <input
                name={`serial_no_${idx}`}
                value={r.serial_no}
                onChange={(e) => updateRowField(idx, "serial_no", e.target.value)}
                placeholder="SL"
                className="p-1 border rounded w-full"
                required
              />
            </div>

            <div className="col-span-3">
              <input
                name={`name_${idx}`}
                value={r.name}
                onChange={(e) => updateRowField(idx, "name", e.target.value)}
                placeholder="Chemical Name"
                className="p-1 border rounded w-full"
                required
              />
            </div>

            <div className="col-span-1">
              <input
                name={`sku_${idx}`}
                value={r.sku}
                onChange={(e) => updateRowField(idx, "sku", e.target.value)}
                placeholder="SKU"
                className="p-1 border rounded w-full"
              />
            </div>

            <div className="col-span-1">
              <input
                name={`quantity_${idx}`}
                type="number"
                value={r.quantity}
                onChange={(e) => updateRowField(idx, "quantity", e.target.value)}
                placeholder="Qty"
                className="p-1 border rounded w-full"
              />
            </div>

            <div className="col-span-1">
              <input
                name={`total_${idx}`}
                value={r.total_quantity}
                readOnly
                className="p-1 border rounded w-full bg-gray-50"
                placeholder="Total"
              />
            </div>

            <div className="col-span-1">
              <input
                name={`consumed_${idx}`}
                type="number"
                value={r.consumed}
                onChange={(e) => updateRowField(idx, "consumed", e.target.value)}
                placeholder="Consumed"
                className="p-1 border rounded w-full"
              />
            </div>

            <div className="col-span-1">
              <input
                name={`actual_${idx}`}
                value={r.actual_stock}
                readOnly
                className="p-1 border rounded w-full bg-gray-50"
                placeholder="Actual Stock"
              />
            </div>

            <div className="col-span-2">
              <input
                name={`receivedon_${idx}`}
                type="date"
                value={r.receivedon || poFields.receivedon || ""}
                onChange={(e) => updateRowField(idx, "receivedon", e.target.value)}
                className="p-1 border rounded w-full"
              />
            </div>

            <div className="col-span-1">
              <button
                type="button"
                onClick={() => removeRow(idx)}
                className="px-2 py-1 bg-red-200 rounded hover:bg-red-300"
                disabled={rows.length === 1}
                title="Remove row"
              >
                −
              </button>
            </div>
          </div>
        ))}

        <div className="mt-3 flex items-center space-x-2">
          <button
            type="button"
            onClick={addRow}
            className="px-3 py-2 bg-green-200 rounded hover:bg-green-300"
            title="Add another chemical under same PO"
          >
             Add chemical
          </button>

        <button
            type="submit"
            className="px-4 py-2 bg-gray-300 text-white rounded hover:bg-gray-400"
            disabled={loading}
          >
            {isPoEditMode ? "Save PO & Chemicals" : "Save Chemicals"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/list")}
            className="ml-2 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
          >
            View All Chemicals
          </button>
        </div>
      </form>
    </div>
  );
}

export default FormPage;
