import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import './styles/Form.css'; 
import bgImage from "./assets/photo.png";  // ✅ Import background image
import API_BASE_URL from "./config"; // ✅ Import base URL

function FormPage({ setIsLoggedIn }) {
  const [chemical, setChemical] = useState({
    slno: "",
    name: "",
    sku: "",
    quantity: "",
    consumed: "",
  });

  const navigate = useNavigate();

  // Auto-calculated values
  const totalQuantity = (chemical.sku && chemical.quantity)
    ? chemical.sku * chemical.quantity
    : "";
  const actualStock = totalQuantity && chemical.consumed
    ? totalQuantity - chemical.consumed
    : totalQuantity;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setChemical({ ...chemical, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSave = { ...chemical, totalQuantity, actualStock };

    await fetch(`${API_BASE_URL}/chemicals`, {   // ✅ updated
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToSave),
    });

    alert("Chemical saved!");
    setChemical({ slno: "", name: "", sku: "", quantity: "", consumed: "" });
  };

  // ✅ FIXED LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);   // ✅ immediately update state in App.js
    navigate("/login");
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center p-6"
      style={{ backgroundImage: `url(${bgImage})` }}  // ✅ Background applied
    >
      {/* 🔹 Top bar with centered heading + buttons on right */}
      <div className="flex items-center justify-between mb-6 relative">
        {/* Centered heading */}
        <h1
          className="absolute left-1/2 transform -translate-x-1/2 text-4xl font-normal text-black"
          style={{ fontFamily: "Times New Roman, Times, serif" }}
        >
          Chemical Inventory
        </h1>

        {/* Right side buttons */}
        <div className="ml-auto">
          <button
            onClick={() => navigate("/list")}
            className="mr-3 px-4 py-2 rounded-md shadow-md bg-gradient-to-r from-blue-200 to-blue-100 text-black hover:scale-105 transition"
          >
            View Chemicals
          </button>
          <button
            onClick={handleLogout}
            className="bg-gradient-to-r from-blue-200 to-blue-100 text-black px-5 py-2 rounded shadow-md hover:scale-105"
          >
            Logout
          </button>
        </div>
      </div>

      {/* 🔹 Elegant Container for Form */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg rounded-xl p-8 max-w-2xl mx-auto border border-indigo-100">
        <h2
          className="text-2xl font-semibold mb-6 text-gray-700 text-center"
          style={{ fontFamily: "Times New Roman, Times, serif" }}
        >
          Add Chemical
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="slno"
            placeholder="Sl No"
            value={chemical.slno}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          
          <input
            type="text"
            name="name"
            placeholder="Chemical Name"
            value={chemical.name}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />

          <input
            type="number"
            name="sku"
            placeholder="SKU (g/ml)"
            value={chemical.sku}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />

          <input
            type="number"
            name="quantity"
            placeholder="Quantity"
            value={chemical.quantity}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />

          <input
            type="number"
            name="consumed"
            placeholder="Consumed"
            value={chemical.consumed}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />

          {/* Auto-calculated fields */}
          <input
            type="number"
            placeholder="Total Quantity"
            value={totalQuantity}
            readOnly
            className="w-full p-3 bg-gray-100 border border-gray-300 rounded-md text-black"
          />

          <input
            type="number"
            placeholder="Actual Stock"
            value={actualStock}
            readOnly
            className="w-full p-3 bg-gray-100 border border-gray-300 rounded-md text-black"
          />

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-blue-200 to-blue-100 text-black font-semibold rounded-md shadow-md hover:scale-105 transition"
          >
            Save Chemical
          </button>
        </form>
      </div>
    </div>
  );
}

export default FormPage;
