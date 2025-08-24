import React, { useEffect, useState } from "react";
import axios from "axios";
import { Trash2 } from "lucide-react"; // ✅ bin icon
import "./styles/List.css";
import API_BASE_URL from "./config"; // ✅ import base URL

function ListPage() {
  const [chemicals, setChemicals] = useState([]);

  // Fetch chemicals
  const fetchChemicals = () => {
    axios
      .get(`${API_BASE_URL}/chemicals`)
      .then((res) => {
        console.log("Fetched Chemicals:", res.data); // 🔍 debug
        setChemicals(res.data);
      })
      .catch((err) => console.error("Error fetching chemicals:", err));
  };

  useEffect(() => {
    fetchChemicals();
  }, []);

  // Delete chemical
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this chemical?")) {
      axios
        .delete(`${API_BASE_URL}/chemicals/${id}`)
        .then(() => fetchChemicals()) // refresh list
        .catch((err) => console.error("Error deleting chemical:", err));
    }
  };

  return (
    <div className="list-background">
      <div className="table-container">
        <h2 className="table-title">All Chemicals</h2>
        <table className="glass-table">
          <thead>
            <tr>
              <th>SL. No</th>
              <th>Chemical Name</th>
              <th>SKU (g/ml)</th>
              <th>Quantity</th>
              <th>Total Quantity</th>
              <th>Consumed</th>
              <th>Actual Stock</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {chemicals.length > 0 ? (
              chemicals.map((c, index) => (
                <tr key={c.id || index}>
                  <td>{c.serial_no || index + 1}</td>
                  <td>{c.name || "—"}</td>
                  <td>{c.sku || 0}</td>
                  <td>{c.quantity || 0}</td>
                  <td>{c.total_quantity || 0}</td>
                  <td>{c.consumed || 0}</td>
                  <td>{c.actual_stock || 0}</td>
                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(c.serial_no)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: "center" }}>
                  No chemicals found
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
