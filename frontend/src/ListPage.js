import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "./config";
import { Edit, Trash2 } from "lucide-react";
import "./styles/List.css";

function ListPage() {
  const [chemicals, setChemicals] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ----- Filters -----
  const [search, setSearch] = useState("");
  const [endUser, setEndUser] = useState("");
  const [vendor, setVendor] = useState("");
  const [poNumber, setPoNumber] = useState("");

  // date filters
  const [receivedFrom, setReceivedFrom] = useState("");
  const [receivedTo, setReceivedTo] = useState("");
  const [poFrom, setPoFrom] = useState("");
  const [poTo, setPoTo] = useState("");
  const [invSubmittedFrom, setInvSubmittedFrom] = useState("");
  const [invSubmittedTo, setInvSubmittedTo] = useState("");

  const fetchChemicals = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/chemicals`);
      const data = await res.json();
      setChemicals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching chemicals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChemicals();
  }, []);

  const handleEdit = (chemical) => {
    navigate("/form", { state: { chemicalToEdit: chemical } });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this chemical?")) {
      try {
        await fetch(`${API_BASE_URL}/chemicals/${id}`, { method: "DELETE" });
        setChemicals((prev) => prev.filter((c) => c.serial_no !== id));
      } catch (err) {
        console.error("Error deleting chemical:", err);
      }
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ----- Build dropdown options from data -----
  const unique = (arr) =>
    Array.from(new Set(arr.filter(Boolean))).sort((a, b) =>
      String(a).localeCompare(String(b))
    );

  const endUsers = useMemo(() => unique(chemicals.map((c) => c.enduser)), [chemicals]);
  const vendors = useMemo(() => unique(chemicals.map((c) => c.vendorname)), [chemicals]);
  const poNumbers = useMemo(() => unique(chemicals.map((c) => c.ponumber)), [chemicals]);

  // ----- Apply filters -----
  const filteredChemicals = useMemo(() => {
    const s = search.trim().toLowerCase();

    const inRange = (dateStr, fromStr, toStr) => {
      if (!dateStr) return false; // when filtering by date, require a date
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      if (fromStr) {
        const f = new Date(fromStr);
        if (d < f) return false;
      }
      if (toStr) {
        const t = new Date(toStr);
        t.setHours(23, 59, 59, 999); // include end date
        if (d > t) return false;
      }
      return true;
    };

    return chemicals.filter((c) => {
      // text search: name, PO, invoice, serial
      if (s) {
        const hay = `${c.name || ""} ${c.ponumber || ""} ${c.invoiceno || ""} ${
          c.serial_no || ""
        }`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      if (endUser && c.enduser !== endUser) return false;
      if (vendor && c.vendorname !== vendor) return false;
      if (poNumber && c.ponumber !== poNumber) return false;

      // date ranges (optional)
      if ((receivedFrom || receivedTo) && !inRange(c.receivedon, receivedFrom, receivedTo))
        return false;
      if ((poFrom || poTo) && !inRange(c.podate, poFrom, poTo)) return false;
      if (
        (invSubmittedFrom || invSubmittedTo) &&
        !inRange(c.invoice_submitted_on, invSubmittedFrom, invSubmittedTo)
      )
        return false;

      return true;
    });
  }, [
    chemicals,
    search,
    endUser,
    vendor,
    poNumber,
    receivedFrom,
    receivedTo,
    poFrom,
    poTo,
    invSubmittedFrom,
    invSubmittedTo,
  ]);

  const resetFilters = () => {
    setSearch("");
    setEndUser("");
    setVendor("");
    setPoNumber("");
    setReceivedFrom("");
    setReceivedTo("");
    setPoFrom("");
    setPoTo("");
    setInvSubmittedFrom("");
    setInvSubmittedTo("");
  };

  return (
    <div className="list-container">
      <div className="list-header">
        <h2>Chemical Inventory List</h2>
        <div>
          <button className="btn-add" onClick={() => navigate("/form")}>
             Add New Chemical
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-card">
        <div className="filters-grid">
          <div className="filter-item">
            <label>Search</label>
            <input
              type="text"
              placeholder="Name / PO / Invoice / Serial"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-item">
            <label>End User</label>
            <select value={endUser} onChange={(e) => setEndUser(e.target.value)}>
              <option value="">All</option>
              {endUsers.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>Vendor</label>
            <select value={vendor} onChange={(e) => setVendor(e.target.value)}>
              <option value="">All</option>
              {vendors.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>PO No.</label>
            <select value={poNumber} onChange={(e) => setPoNumber(e.target.value)}>
              <option value="">All</option>
              {poNumbers.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="filter-item">
            <label>Received From</label>
            <input
              type="date"
              value={receivedFrom}
              onChange={(e) => setReceivedFrom(e.target.value)}
            />
          </div>
          <div className="filter-item">
            <label>Received To</label>
            <input
              type="date"
              value={receivedTo}
              onChange={(e) => setReceivedTo(e.target.value)}
            />
          </div>

          <div className="filter-item">
            <label>PO Date From</label>
            <input type="date" value={poFrom} onChange={(e) => setPoFrom(e.target.value)} />
          </div>
          <div className="filter-item">
            <label>PO Date To</label>
            <input type="date" value={poTo} onChange={(e) => setPoTo(e.target.value)} />
          </div>

          <div className="filter-item">
            <label>Invoice Submitted From</label>
            <input
              type="date"
              value={invSubmittedFrom}
              onChange={(e) => setInvSubmittedFrom(e.target.value)}
            />
          </div>
          <div className="filter-item">
            <label>Invoice Submitted To</label>
            <input
              type="date"
              value={invSubmittedTo}
              onChange={(e) => setInvSubmittedTo(e.target.value)}
            />
          </div>
        </div>

        <div className="filters-actions">
          <span className="filters-count">
            {loading ? "Loading..." : `${filteredChemicals.length} / ${chemicals.length} shown`}
          </span>
          <button className="btn-reset" onClick={resetFilters}>
            Reset
          </button>
          <button className="btn-refresh" onClick={fetchChemicals}>
            Refresh
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="chem-table">
          <thead>
            <tr>
              <th>Sl.No.</th>
              <th>Chemical Name</th>
              <th>SKU</th>
              <th>Quantity</th>
              <th>Total Quantity</th>
              <th>Consumed</th>
              <th>Actual Stock</th>
              <th>Received On</th>
              <th>End User</th>
              <th>Vendor Name</th>
              <th>PO No.</th>
              <th>PO Date</th>
              <th>Invoice No</th>
              <th>Invoice Date</th>
              <th>Invoice Amount</th>
              <th>Invoice Submitted On</th>
              <th>Remarks</th>
              <th>       </th>
            </tr>
          </thead>
          <tbody>
            {filteredChemicals.length > 0 ? (
              filteredChemicals.map((c, idx) => (
                <tr key={c.serial_no ?? idx}>
                  <td>{c.serial_no ?? "-"}</td>
                  <td>{c.name ?? "-"}</td>
                  <td>{c.sku ?? "-"}</td>
                  <td>{c.quantity ?? "-"}</td>
                  <td>{c.total_quantity ?? "-"}</td>
                  <td>{c.consumed ?? "-"}</td>
                  <td>{c.actual_stock ?? "-"}</td>
                  <td>{formatDate(c.receivedon)}</td>
                  <td>{c.enduser ?? "-"}</td>
                  <td>{c.vendorname ?? "-"}</td>
                  <td>{c.ponumber ?? "-"}</td>
                  <td>{formatDate(c.podate)}</td>
                  <td>{c.invoiceno ?? "-"}</td>
                  <td>{formatDate(c.invoicedate)}</td>
                  <td>{c.invoiceamount ?? "-"}</td>
                  <td>{formatDate(c.invoice_submitted_on)}</td>
                  <td>{c.remarks ?? "-"}</td>
                  <td className="actions-cell">
                    <Edit className="icon edit-icon" onClick={() => handleEdit(c)} />
                    <Trash2 className="icon delete-icon" onClick={() => handleDelete(c.serial_no)} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="18" className="no-data">
                  {loading ? "Loading..." : "No chemicals found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ListPage;
