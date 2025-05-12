import './App.css';
import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
const axios = require('axios');

const BACKEND_URL = 'https://zany-rotary-phone-j7wqgxwwgq25r56-4000.app.github.dev/';

const categories = [
  { icon: "👌", label: "ORDER MENU" },
  { icon: "🍛", label: "Steak" },
  { icon: "🍜", label: "Ramen" },
  { icon: "🍲", label: "Teppanyaki" },
];

const menuItems = [
  { id: 1, name: "Chilli prawn + kimchi", price: 18.90, img: "https://static01.nyt.com/images/2018/10/10/dining/ch-buttery-kimchi-shrimp/ch-buttery-kimchi-shrimp-threeByTwoMediumAt2X.jpg", category: 'drink' },
  { id: 2, name: "Sirloin steak", price: 21.90, img: "https://sp-ao.shortpixel.ai/client/to_auto,q_lossy,ret_img/https://1855beef.com/wp-content/uploads/2017/06/P_Recipe_Pecan-and-Chipotle-rubbed-1855-Sirloin-Flap-360x240.jpg", category: 'food' },
  { id: 3, name: "Cod Ramen", price: 18.90, img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtT9Rx2FkGj-sdMXAS7ph2vlzTSu2V5MJQGw&s", category: "food" },
  { id: 4, name: "Chicken ramen", price: 19.90, img: "https://assets.epicurious.com/photos/54ad70036529d92b2c046e6b/1:1/w_886,h_886,c_limit/51187270_shoyu-ramen_1x1.jpg", category: 'food' },
  { id: 5, name: "Ribeye steak", price: 23.90, img: "https://sp-ao.shortpixel.ai/client/to_auto,q_lossy,ret_img/https://1855beef.com/wp-content/uploads/2020/04/JBSE-1855-0420_Ribeye-360x240.jpg", category: 'food' },
  { id: 6, name: "Tenderloin steak", price: 18.90, img: "https://sp-ao.shortpixel.ai/client/to_auto,q_lossy,ret_img,w_1500/https://1855beef.com/wp-content/uploads/2022/08/1855_AnchoCoffee_2022-scaled-e1664379254741.jpg", category: 'drink' },
];

function App() {
  const [order, setOrder] = useState([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [qrValue, setQrValue] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const addToOrder = (item) => {
    const exists = order.find((o) => o.id === item.id);
    if (exists) {
      setOrder(order.map((o) => o.id === item.id ? { ...o, qty: o.qty + 1 } : o));
    } else {
      setOrder([...order, { ...item, qty: 1 }]);
    }
  };

  const removeItem = (id) => {
    setOrder(order.filter((item) => item.id !== id));
  };

  const totalAmount = order.reduce((sum, item) => sum + item.qty * item.price, 0).toFixed(2);

  const simulateApiCall = async (type) => {
    try {
      const body = { amount: totalAmount, items: order };
      const endpoint = type === "TRC20" ? "invoice/trc20" : "invoice/lightning";

      const response = await fetch(BACKEND_URL + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const data = await response.json();
      const paymentCode = type === "TRC20" ? `USDT:${data.address}?amount=${data.amount}` : data.payReq;

      setQrValue(paymentCode);
      setPaymentMethod(type);
      setShowReceipt(true);
      await sendOrderToPrinter();
  } catch (err) {
    console.error("Error:", err);
    alert("Payment failed: " + err.message);
  }
};

const sendOrderToPrinter = async () => {
  try {
    await fetch(BACKEND_URL + "print-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: order }),
    });
  } catch (err) {
    console.error("Failed to send to printer:", err);
  }
};

  return (
    <div style={{ fontFamily: "sans-serif", padding: 10 }}>
      <div style={{ display: "flex", overflowX: "auto", marginBottom: 20 }}>
        {categories.map((cat) => (
          <div key={cat.label} style={{ marginRight: 20, textAlign: "center" }}>
            <div style={{ fontSize: 24 }}>{cat.icon}</div>
            <div>{cat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {menuItems.map((item) => (
          <div
            key={item.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 10,
              padding: 10,
              textAlign: "center",
            }}
            onClick={() => addToOrder(item)}
          >
            <img src={item.img} alt={item.name} style={{ width: "100%", borderRadius: 8 }} />
            <div style={{ fontWeight: "bold", marginTop: 5 }}>{item.name}</div>
            <div style={{ color: "#666" }}>${item.price.toFixed(2)} </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>Your Order</h3>
        {order.length === 0 ? <p>No items.</p> : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {order.map((item) => (
              <li key={item.id} style={{ marginBottom: 8 }}>
                {item.name} x {item.qty} = ${(item.price * item.qty).toFixed(2)}
                <button
                  onClick={() => removeItem(item.id)}
                  style={{ marginLeft: 10, background: "red", color: "white", border: "none", borderRadius: 5, padding: "2px 6px" }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <h4>Total: ${totalAmount}</h4>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <button onClick={() => simulateApiCall("TRC20")} style={{ flex: 1, background: "#ff0066", color: "#fff", padding: 10, border: "none", borderRadius: 5 }}>
          Add to Order
        </button>
        <button onClick={() => simulateApiCall("Lightning")} style={{ flex: 1, background: "#ffaa00", color: "#fff", padding: 10, border: "none", borderRadius: 5 }}>
          Pay
        </button>
      </div>

      {showReceipt && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex", justifyContent: "center", alignItems: "center"
        }}>
          <div style={{ background: "#fff", padding: 20, borderRadius: 10, textAlign: "center", maxWidth: 400 }}>
            <h3>Order Receipt</h3>
            <p>Payment Method: {paymentMethod}</p>
            <p>Total: ${totalAmount}</p>
            <div style={{ margin: "20px auto", width: 200 }}>
              <QRCodeCanvas value={qrValue || 'N/A'} size={200} />
              <p style={{ fontSize: 12, wordBreak: "break-word" }}>{qrValue}</p>
            </div>
            <button onClick={() => {
              setOrder([]);
              setShowReceipt(false);
              setQrValue("");
            }} style={{ background: "#333", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 5 }}>
              Back to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;