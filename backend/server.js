require('dotenv').config();
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
let sgMail = null;
const session = require('express-session');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true, credentials: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change_this_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
  })
);

// Database (SQLite)
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

  db.run(
    `CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      total REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(customer_id) REFERENCES customers(id)
    )`
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      company TEXT NOT NULL,
      product TEXT NOT NULL,
      mrp REAL NOT NULL,
      quantity INTEGER NOT NULL,
      line_total REAL NOT NULL,
      FOREIGN KEY(order_id) REFERENCES orders(id)
    )`
  );
});

// In-memory OTP store: { email: { otp, name, expires } }
const otps = {}; // simple in-memory store; restart clears it

// Nodemailer transport (only created if credentials provided)
let transporter = null;
// Priority: SENDGRID_API_KEY -> Gmail creds -> log only
if (process.env.SENDGRID_API_KEY) {
  // Prefer SendGrid API (HTTPS) to avoid SMTP port blocking on hosts.
  try {
    sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('Using SendGrid API for sending emails.');
  } catch (e) {
    // If require fails (package missing), fall back to SendGrid SMTP via Nodemailer
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
    console.log('Using SendGrid SMTP for sending emails.');
  }
} else if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  console.log('Using Gmail SMTP for sending emails.');
} else {
  console.warn('EMAIL_USER or EMAIL_PASS not set — emails will be logged, not sent.');
}
require('dotenv').config();
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
let sgMail = null;
const session = require('express-session');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true, credentials: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change_this_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
  })
);

// Database (SQLite)
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

  db.run(
    `CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      total REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(customer_id) REFERENCES customers(id)
    )`
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      company TEXT NOT NULL,
      product TEXT NOT NULL,
      mrp REAL NOT NULL,
      quantity INTEGER NOT NULL,
      line_total REAL NOT NULL,
      FOREIGN KEY(order_id) REFERENCES orders(id)
    )`
  );
});

// In-memory OTP store: { email: { otp, name, expires } }
const otps = {}; // simple in-memory store; restart clears it

// Nodemailer transport (only created if credentials provided)
let transporter = null;
// Priority: SENDGRID_API_KEY -> Gmail creds -> log only
if (process.env.SENDGRID_API_KEY) {
  // Prefer SendGrid API (HTTPS) to avoid SMTP port blocking on hosts.
  try {
    sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('Using SendGrid API for sending emails.');
  } catch (e) {
    // If require fails (package missing), fall back to SendGrid SMTP via Nodemailer
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
    console.log('Using SendGrid SMTP for sending emails.');
  }
} else if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  console.log('Using Gmail SMTP for sending emails.');
} else {
  console.warn('EMAIL_USER or EMAIL_PASS not set — emails will be logged, not sent.');
}

function sendMailAsync(mailOptions) {
  return new Promise((resolve, reject) => {
    // If SendGrid API is available, use it (HTTPS) which avoids SMTP port blocks.
    if (sgMail) {
      const msg = {
        to: mailOptions.to,
        from: mailOptions.from || process.env.EMAIL_USER || 'no-reply@example.com',
        subject: mailOptions.subject,
        text: mailOptions.text,
        html: mailOptions.html,
      };
      return sgMail
        .send(msg)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    }

    if (!transporter) {
      console.log('--- Email content (not sent because transporter missing) ---');
      console.log(mailOptions);
      console.log('--- End email ---');
      return resolve({ accepted: [], info: 'transporter-missing' });
    }

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) return reject(err);
      resolve(info);
    });
  });
}

// Serve frontend static files
const FRONTEND_PATH = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_PATH));

// Simple in-memory products catalog
const CATALOG = {
  Classmate: ['Executive Hindi', 'Executive English', 'Mathematics', 'Register', 'A4 Copy'],
  Navneet: ['Drawing Book', 'Notebook 200pg', 'Sketch Book'],
  Camlin: ['Pencil', 'Eraser', 'Sharpener', 'Colors']
};

const MRPS = [20, 30, 40];

// API: send OTP
app.post('/api/send-otp', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ success: false, error: 'Name and email required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes
    otps[email] = { otp, name, expires };

    const mailOptions = {
      from: process.env.EMAIL_USER || 'no-reply@example.com',
      to: email,
      subject: 'Your OTP for Shop Order',
      text: `Hello ${name},\n\nYour OTP is ${otp}. It expires in 5 minutes.\n\nThank you.`,
    };

    try {
      await sendMailAsync(mailOptions);
      return res.json({ success: true, message: 'OTP sent (or logged). Check your email.' });
    } catch (e) {
      console.error('Failed to send OTP email:', e);
      return res.status(500).json({ success: false, error: 'Failed to send OTP email. Check server logs.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// API: verify OTP
app.post('/api/verify-otp', (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, error: 'Email and OTP are required' });

    const record = otps[email];
    if (!record) return res.status(400).json({ success: false, error: 'No OTP requested for this email' });
    if (Date.now() > record.expires) {
      delete otps[email];
      return res.status(400).json({ success: false, error: 'OTP expired' });
    }
    if (record.otp !== otp) return res.status(400).json({ success: false, error: 'Invalid OTP' });

    // OTP valid — create or get customer
    db.get('SELECT id FROM customers WHERE email = ?', [email], (err, row) => {
      if (err) {
        console.error('DB error:', err);
        return res.status(500).json({ success: false, error: 'Database error' });
      }
      function finishWithCustomerId(customerId) {
        req.session.customerId = customerId;
        req.session.customerName = record.name;
        req.session.customerEmail = email;
        delete otps[email];
        return res.json({ success: true, message: 'OTP verified' });
      }

      if (row) {
        finishWithCustomerId(row.id);
      } else {
        db.run('INSERT INTO customers (name, email) VALUES (?, ?)', [record.name, email], function (err2) {
          if (err2) {
            console.error('Insert customer failed:', err2);
            return res.status(500).json({ success: false, error: 'Failed to create customer' });
          }
          finishWithCustomerId(this.lastID);
        });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// API: get products
app.get('/api/products', (req, res) => {
  // Return catalog and MRPs
  res.json({ success: true, catalog: CATALOG, mrps: MRPS });
});

// API: place order
app.post('/api/place-order', async (req, res) => {
  try {
    const customerId = req.session.customerId;
    const customerName = req.session.customerName;
    const customerEmail = req.session.customerEmail;
    if (!customerId) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const { cart } = req.body;
    if (!Array.isArray(cart) || cart.length === 0) return res.status(400).json({ success: false, error: 'Cart is empty' });

    // Calculate totals
    let total = 0;
    const items = cart.map((it) => {
      const mrp = Number(it.mrp) || 0;
      const qty = parseInt(it.quantity, 10) || 0;
      const line = mrp * qty;
      total += line;
      return { company: it.company, product: it.product, mrp: mrp, quantity: qty, line_total: line };
    });

    // Insert order
    db.run('INSERT INTO orders (customer_id, total) VALUES (?, ?)', [customerId, total], function (err) {
      if (err) {
        console.error('Insert order failed:', err);
        return res.status(500).json({ success: false, error: 'Failed to create order' });
      }
      const orderId = this.lastID;
      const stmt = db.prepare('INSERT INTO order_items (order_id, company, product, mrp, quantity, line_total) VALUES (?, ?, ?, ?, ?, ?)');
      items.forEach((it) => {
        stmt.run(orderId, it.company, it.product, it.mrp, it.quantity, it.line_total);
      });
      stmt.finalize(async (finalizeErr) => {
        if (finalizeErr) console.error('Finalize stmt error:', finalizeErr);

        // Send emails to customer and shop owner
        const orderRowsHtml = items
          .map((it) => `<tr><td>${it.company}</td><td>${it.product}</td><td>${it.mrp}</td><td>${it.quantity}</td><td>${it.line_total}</td></tr>`)
          .join('');
        const html = `<p>Hi ${customerName},</p>
          <p>Thank you for your order. Order ID: <strong>${orderId}</strong></p>
          <table border="1" cellpadding="6" cellspacing="0">
            <thead><tr><th>Company</th><th>Product</th><th>MRP</th><th>Qty</th><th>Line Total</th></tr></thead>
            <tbody>${orderRowsHtml}</tbody>
          </table>
          <p><strong>Total: ${total}</strong></p>
        `;

        const mailToCustomer = {
          from: process.env.EMAIL_USER || 'no-reply@example.com',
          to: customerEmail,
          subject: `Order Confirmation (#${orderId})`,
          html,
        };

        const mailToOwner = {
          from: process.env.EMAIL_USER || 'no-reply@example.com',
          to: process.env.SHOP_OWNER_EMAIL || 'shopowner@gmail.com',
          subject: `New Order (#${orderId}) by ${customerName}`,
          html: `<p>New order received. Customer: ${customerName} (${customerEmail})</p>` + html,
        };

        try {
          await sendMailAsync(mailToCustomer);
        } catch (e) {
          console.error('Failed to send email to customer:', e);
        }
        try {
          await sendMailAsync(mailToOwner);
        } catch (e) {
          console.error('Failed to send email to owner:', e);
        }

        return res.json({ success: true, orderId, total });
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Fallback - serve index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
>>>>>>> be1b140 (Use SendGrid API for email (fallback to SMTP/logging))
