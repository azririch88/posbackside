// POS Backend (Node.js + Express)

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const WebSocket = require('ws');
const fetch = require('node-fetch'); // added for webhook sending

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());
const receivedOrders = []; // to store all incoming orders


// In-memory order store
const orders = {};

// Simulate creating a Lightning invoice (replace with LND/BTCPayServer later)
app.post('/invoice/lightning', (req, res) => {
  const { amount } = req.body;
  const invoiceId = `ln-${Date.now()}`;
  orders[invoiceId] = { type: 'lightning', amount, status: 'pending' };
  res.json({ invoiceId, payReq: `lnbc-invoice-for-${amount}` });
});

// Simulate TRC20 USDT invoice
app.post('/invoice/trc20', (req, res) => {
  const { amount } = req.body;
  const invoiceId = `trc20-${Date.now()}`;
  const walletAddress = 'TJkiT9UbNDM4jHqdk2ibWzkVhZtC4W5FdW';

  orders[invoiceId] = { type: 'trc20', amount, status: 'pending' };
  res.json({ invoiceId, address: walletAddress, amount });
});

// Check payment status
app.get('/status/:invoiceId', (req, res) => {
  const { invoiceId } = req.params;
  const order = orders[invoiceId];
  if (!order) return res.status(404).json({ error: 'Invoice not found' });
  res.json({ status: order.status });
});

// Simulate payment confirmation (for testing)
app.post('/confirm/:invoiceId', (req, res) => {
  const { invoiceId } = req.params;
  if (orders[invoiceId]) {
    orders[invoiceId].status = 'paid';
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Invoice not found' });
  }
});

// NEW: Send order to printer (Beeceptor webhook)

const axios = require('axios'); // ADD THIS at the top with your other imports

// NEW: Send order to printer (Beeceptor webhook)
app.post('/print-order', async (req, res) => {
  const orderData = req.body;
  const foodItems = [];
  const drinkItems = [];

  receivedOrders.push(orderData);

  // Split food and drinks
  for (const item of orderData.items) {
    if (item.category === 'food') {
      foodItems.push(item);
    } else if (item.category === 'drink') {
      drinkItems.push(item);
    }
  }

  const kitchenWebhookUrl = 'https://printersim.free.beeceptor.com';
  const barWebhookUrl = 'https://webhook.site/69e56400-de40-4782-82fe-acba2ff35b54';

  try {
    if (foodItems.length > 0) {
      const foodOrder = { ...orderData, items: foodItems };
      await axios.post(kitchenWebhookUrl, foodOrder);
    }

    if (drinkItems.length > 0) {
      const drinkOrder = { ...orderData, items: drinkItems };
      await axios.post(barWebhookUrl, drinkOrder);
    }

    res.json({ success: true, message: 'Order sent to kitchen and bar printers' });
  } catch (error) {
    console.error('Printer webhook error:', error.message);
    res.status(500).json({ success: false, error: 'Printer webhook failed' });
  }
});

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ port: 4001 });
wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    const { invoiceId } = JSON.parse(msg);
    const checkStatus = setInterval(() => {
      const order = orders[invoiceId];
      if (order && order.status === 'paid') {
        ws.send(JSON.stringify({ status: 'paid', invoiceId }));
        clearInterval(checkStatus);
      }
    }, 1000);
  });
});

app.listen(PORT, () => {
  console.log(`POS backend running on http://localhost:${PORT}`);
});