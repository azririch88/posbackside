// POS Backend (Node.js + Express)

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const WebSocket = require('ws');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());

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

