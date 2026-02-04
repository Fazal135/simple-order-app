require('dotenv').config();

const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');

const app = express();
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;

// ---------------- MIDDLEWARE ----------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true, credentials: true }));

app.use(
  session({
    name: 'shop.sid',
    secret: process.env.SESSION_SECRET || 'change_this_secret',
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    }
  })
);

// ---------------- DATABASE ----------------
const DB_PATH = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Failed to open database:', err);
    process.exit(1);
  }
  console.log('Connected to SQLite database.');
});

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');

  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      total REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(customer_id) REFERENCES customers(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      company TEXT NOT NULL,
      product TEXT NOT NULL,
      mrp REAL NOT NULL,
      quantity INTEGER NOT NULL,
      line_total REAL NOT NULL,
      FOREIGN KEY(order_id) REFERENCES orders(id)
    )
  `);
});

// ---------------- OTP STORE ----------------
const otps = {};

// ---------------- SENDGRID ----------------
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.SHOP_OWNER_EMAIL || 'no-reply@example.com';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log('Using SendGrid API for sending emails.');
} else {
  console.warn('SENDGRID_API_KEY not set — emails will be logged, not sent.');
}

function sendMailAsync(mailOptions) {
  const msg = {
    to: mailOptions.to,
    from: mailOptions.from || EMAIL_FROM,
    subject: mailOptions.subject,
    text: mailOptions.text,
    html: mailOptions.html,
  };

  if (!SENDGRID_API_KEY) {
    console.log('--- Email content (not sent) ---');
    console.log(msg);
    console.log('--- End email ---');
    return Promise.resolve();
  }

  return sgMail.send(msg);
}

// ---------------- FRONTEND ----------------
const FRONTEND_PATH = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_PATH));

// ---------------- DATA ----------------
const CATALOG = {
  Classmate: ['Executive Hindi', 'Executive English', 'Mathematics', 'Register', 'A4 Copy'],
  Navneet: ['Drawing Book', 'Notebook 200pg', 'Sketch Book'],
  Camlin: ['Pencil', 'Eraser', 'Sharpener', 'Colors'],
};

const MRPS = [20, 30, 40];

// ---------------- AUTH ----------------
app.post('/api/send-otp', async (req, res) => {
  console.log('OTP request received');

  try {
    const { name, email } = req.body;

    if (!name || !email)
      return res.status(400).json({ success: false, error: 'Name and email required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 5 * 60 * 1000;

    otps[email] = { otp, name, expires };

    await sendMailAsync({
      to: email,
      subject: 'Your OTP for Shop Order',
      text: `Hello ${name},\n\nYour OTP is ${otp}. It expires in 5 minutes.\n\nThank you.`
    });

    return res.json({ success: true, message: 'OTP sent' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.post('/api/verify-otp', (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({ success: false, error: 'Email and OTP required' });

    const record = otps[email];

    if (!record)
      return res.status(400).json({ success: false, error: 'OTP not found or expired' });

    if (Date.now() > record.expires) {
      delete otps[email];
      return res.status(400).json({ success: false, error: 'OTP expired' });
    }

    if (record.otp !== otp)
      return res.status(400).json({ success: false, error: 'Invalid OTP' });

    db.get(
      'SELECT id, name FROM customers WHERE email = ?',
      [email],
      (err, row) => {

        if (err) {
          console.error(err);
          return res.status(500).json({ success: false, error: 'Database error' });
        }

        const finish = (id, name) => {
          req.session.customerId = id;
          req.session.customerName = name;
          req.session.customerEmail = email;
          delete otps[email];
          res.json({ success: true });
        };

        if (row) return finish(row.id, row.name);

        db.run(
          'INSERT INTO customers (name, email) VALUES (?, ?)',
          [record.name, email],
          function (err2) {
            if (err2) {
              console.error(err2);
              return res.status(500).json({ success: false });
            }
            finish(this.lastID, record.name);
          }
        );
      }
    );

  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
});

// ---------------- SESSION CHECK ----------------
app.get('/api/me', (req, res) => {
  if (req.session && req.session.customerId) {
    return res.json({
      loggedIn: true,
      name: req.session.customerName,
      email: req.session.customerEmail
    });
  }

  res.json({ loggedIn: false });
});

// ---------------- PRODUCTS ----------------
app.get('/api/products', (req, res) => {
  res.json({ success: true, catalog: CATALOG, mrps: MRPS });
});

// ---------------- ORDER ----------------
app.post('/api/place-order', (req, res) => {

  const customerId = req.session.customerId;
  const customerName = req.session.customerName;
  const customerEmail = req.session.customerEmail;

  if (!customerId)
    return res.status(401).json({ success: false, error: 'Not authenticated' });

  const { cart } = req.body;

  if (!Array.isArray(cart) || cart.length === 0)
    return res.status(400).json({ success: false, error: 'Cart is empty' });

  let total = 0;

  const items = cart.map(it => {
    const mrp = Number(it.mrp);
    const qty = Number(it.quantity);
    const line = mrp * qty;
    total += line;
    return { ...it, line_total: line };
  });

  db.run(
    'INSERT INTO orders (customer_id, total) VALUES (?, ?)',
    [customerId, total],
    function (err) {

      if (err) {
        console.error(err);
        return res.status(500).json({ success: false });
      }

      const orderId = this.lastID;

      const stmt = db.prepare(
        'INSERT INTO order_items (order_id, company, product, mrp, quantity, line_total) VALUES (?, ?, ?, ?, ?, ?)'
      );

      items.forEach(i => {
        stmt.run(orderId, i.company, i.product, i.mrp, i.quantity, i.line_total);
      });

      stmt.finalize(async () => {

        /* =========================================================
           ONLY CHANGE: structured table email (customer + owner)
           ========================================================= */

        const rows = items.map(i => `
          <tr>
            <td>${i.company}</td>
            <td>${i.product}</td>
            <td>${i.mrp}</td>
            <td>${i.quantity}</td>
            <td>${i.line_total}</td>
          </tr>
        `).join('');

        const htmlTable = `
          <p>Hi ${customerName},</p>
          <p>Thank you for your order.</p>
          <p><strong>Order ID:</strong> ${orderId}</p>

          <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;">
            <thead>
              <tr>
                <th>Company</th>
                <th>Product</th>
                <th>MRP</th>
                <th>Qty</th>
                <th>Line Total</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4"><strong>Total</strong></td>
                <td><strong>${total}</strong></td>
              </tr>
            </tfoot>
          </table>
        `;

        await sendMailAsync({
          to: customerEmail,
          subject: `Order Confirmation (#${orderId})`,
          html: htmlTable
        });

        await sendMailAsync({
          to: process.env.SHOP_OWNER_EMAIL,
          subject: `New Order (#${orderId}) by ${customerName}`,
          html: `
            <p>New order received.</p>
            <p><strong>Customer:</strong> ${customerName} (${customerEmail})</p>
            ${htmlTable}
          `
        });

        /* ========================================================= */

        res.json({ success: true, orderId, total });
      });
    }
  );
});

// ---------------- FALLBACK ----------------
app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});