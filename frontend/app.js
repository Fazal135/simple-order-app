// Simple frontend JS for login with OTP and order placement
(function () {
  const q = (s) => document.querySelector(s);
  const sendBtn = q('#send-otp');
  const verifyBtn = q('#verify-otp');
  const nameInput = q('#name');
  const emailInput = q('#email');
  const otpSection = q('#otp-section');
  const otpInput = q('#otp');
  const loginMsg = q('#login-msg');
  const loginView = q('#login-view');
  const orderView = q('#order-view');
  const companySelect = q('#company-select');
  const productSelect = q('#product-select');
  const mrpSelect = q('#mrp-select');
  const quantityInput = q('#quantity');
  const addToCartBtn = q('#add-to-cart');
  const cartTableBody = q('#cart-table tbody');
  const grandTotalEl = q('#grand-total');
  const placeOrderBtn = q('#place-order');
  const orderMsg = q('#order-msg');

  let catalog = {};
  let mrps = [];
  const cart = [];

  async function api(path, opts) {
    const res = await fetch(path, Object.assign({ credentials: 'include' }, opts));
    return res.json();
  }

  // Send OTP
  sendBtn.addEventListener('click', async () => {
    loginMsg.textContent = '';
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    if (!name || !email) { loginMsg.textContent = 'Name and email required'; return; }
    const resp = await api('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });
    if (resp.success) {
      otpSection.style.display = 'block';
      loginMsg.textContent = resp.message || 'OTP sent';
    } else {
      loginMsg.textContent = resp.error || 'Failed to send OTP';
    }
  });

  // Verify OTP
  verifyBtn.addEventListener('click', async () => {
    loginMsg.textContent = '';
    const email = emailInput.value.trim();
    const otp = otpInput.value.trim();
    if (!email || !otp) { loginMsg.textContent = 'Email and OTP required'; return; }
    const resp = await api('/api/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    if (resp.success) {
      loginView.style.display = 'none';
      orderView.style.display = 'block';
      fetchCatalog();
    } else {
      loginMsg.textContent = resp.error || 'OTP verification failed';
    }
  });

  async function fetchCatalog() {
    const resp = await api('/api/products');
    if (resp.success) {
      catalog = resp.catalog || {};
      mrps = resp.mrps || [20, 30, 40];
      populateCompanies();
    } else {
      orderMsg.textContent = 'Failed to load products';
    }
  }

  function populateCompanies() {
    companySelect.innerHTML = '';
    Object.keys(catalog).forEach((c) => {
      const o = document.createElement('option');
      o.value = c;
      o.textContent = c;
      companySelect.appendChild(o);
    });
    onCompanyChange();
  }

  function onCompanyChange() {
    const company = companySelect.value;
    const products = catalog[company] || [];
    productSelect.innerHTML = '';
    products.forEach((p) => {
      const o = document.createElement('option');
      o.value = p;
      o.textContent = p;
      productSelect.appendChild(o);
    });
    populateMrps();
  }

  function populateMrps() {
    mrpSelect.innerHTML = '';
    mrps.forEach((m) => {
      const o = document.createElement('option');
      o.value = m;
      o.textContent = m;
      mrpSelect.appendChild(o);
    });
  }

  companySelect.addEventListener('change', onCompanyChange);

  addToCartBtn.addEventListener('click', () => {
    const company = companySelect.value;
    const product = productSelect.value;
    const mrp = Number(mrpSelect.value);
    const qty = parseInt(quantityInput.value, 10) || 0;
    if (!company || !product || !mrp || qty <= 0) {
      orderMsg.textContent = 'Select product and valid quantity';
      return;
    }
    const line = mrp * qty;
    cart.push({ company, product, mrp, quantity: qty, line_total: line });
    renderCart();
    orderMsg.textContent = '';
  });

  function renderCart() {
    cartTableBody.innerHTML = '';
    let total = 0;
    cart.forEach((it) => {
      total += it.line_total;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${it.company}</td><td>${it.product}</td><td>${it.mrp}</td><td>${it.quantity}</td><td>${it.line_total}</td>`;
      cartTableBody.appendChild(tr);
    });
    grandTotalEl.textContent = total;
  }

  placeOrderBtn.addEventListener('click', async () => {
    if (cart.length === 0) { orderMsg.textContent = 'Cart empty'; return; }
    const resp = await api('/api/place-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart }),
    });
    if (resp.success) {
      orderMsg.textContent = `Order placed successfully. Order ID: ${resp.orderId}. Total: ${resp.total}`;
      cart.length = 0;
      renderCart();
    } else {
      orderMsg.textContent = resp.error || 'Failed to place order';
    }
  });
})();<<<<<<< HEAD
    } else {
      loginMsg.textContent = resp.error || 'Failed to send OTP';
    }
  });

  // Verify OTP
  verifyBtn.addEventListener('click', async () => {
    loginMsg.textContent = '';
    const email = emailInput.value.trim();
    const otp = otpInput.value.trim();
    if (!email || !otp) { loginMsg.textContent = 'Email and OTP required'; return; }
    const resp = await api('/api/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp }) });
    if (resp.success) {
      // show order view
      loginView.style.display = 'none';
      orderView.style.display = 'block';
      fetchCatalog();
    } else {
      loginMsg.textContent = resp.error || 'OTP verification failed';
    }
  });

  async function fetchCatalog() {
    const resp = await api('/api/products');
    if (resp.success) {
      catalog = resp.catalog || {};
      mrps = resp.mrps || [20,30,40];
      populateCompanies();
    } else {
      orderMsg.textContent = 'Failed to load products';
    }
  }

  function populateCompanies() {
    companySelect.innerHTML = '';
    Object.keys(catalog).forEach((c) => {
      const o = document.createElement('option'); o.value = c; o.textContent = c; companySelect.appendChild(o);
    });
    onCompanyChange();
  }

    const resp = await api('/api/place-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cart }) });
    if (resp.success) {
      orderMsg.textContent = `Order placed successfully. Order ID: ${resp.orderId}. Total: ${resp.total}`;
      cart.length = 0; renderCart();
    } else {
      orderMsg.textContent = resp.error || 'Failed to place order';
    }
  });

})();
=======
// Simple frontend JS for login with OTP and order placement
(function () {
  const q = (s) => document.querySelector(s);
  const sendBtn = q('#send-otp');
  const verifyBtn = q('#verify-otp');
  const nameInput = q('#name');
  const emailInput = q('#email');
  const otpSection = q('#otp-section');
  const otpInput = q('#otp');
  const loginMsg = q('#login-msg');
  const loginView = q('#login-view');
  const orderView = q('#order-view');
  const companySelect = q('#company-select');
  const productSelect = q('#product-select');
  const mrpSelect = q('#mrp-select');
  const quantityInput = q('#quantity');
  const addToCartBtn = q('#add-to-cart');
  const cartTableBody = q('#cart-table tbody');
  const grandTotalEl = q('#grand-total');
  const placeOrderBtn = q('#place-order');
  const orderMsg = q('#order-msg');

  let catalog = {};
  let mrps = [];
  const cart = [];

  async function api(path, opts) {
    const res = await fetch(path, Object.assign({ credentials: 'include' }, opts));
  }

  // Send OTP
  sendBtn.addEventListener('click', async () => {
    loginMsg.textContent = '';
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    if (!name || !email) { loginMsg.textContent = 'Name and email required'; return; }
    const resp = await api('/api/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email }) });
    if (resp.success) {
      otpSection.style.display = 'block';
      loginMsg.textContent = resp.message || 'OTP sent';
    } else {
      loginMsg.textContent = resp.error || 'Failed to send OTP';
    }
  });

  // Verify OTP
  verifyBtn.addEventListener('click', async () => {
    loginMsg.textContent = '';
    const email = emailInput.value.trim();
    const otp = otpInput.value.trim();
    if (!email || !otp) { loginMsg.textContent = 'Email and OTP required'; return; }
    const resp = await api('/api/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp }) });
    if (resp.success) {
      // show order view
      loginView.style.display = 'none';
      orderView.style.display = 'block';
      fetchCatalog();
    } else {
      loginMsg.textContent = resp.error || 'OTP verification failed';
    }
  });

  async function fetchCatalog() {
    const resp = await api('/api/products');
    if (resp.success) {
      catalog = resp.catalog || {};
      mrps = resp.mrps || [20,30,40];
      populateCompanies();
    } else {
      orderMsg.textContent = 'Failed to load products';
    }
  }

  function populateCompanies() {
    companySelect.innerHTML = '';
    Object.keys(catalog).forEach((c) => {
      const o = document.createElement('option'); o.value = c; o.textContent = c; companySelect.appendChild(o);
    });
    onCompanyChange();
  }

  function onCompanyChange() {
    const company = companySelect.value;
    const products = catalog[company] || [];
    productSelect.innerHTML = '';
    products.forEach((p) => { const o = document.createElement('option'); o.value = p; o.textContent = p; productSelect.appendChild(o); });
    populateMrps();
  }

  function populateMrps() {
    mrpSelect.innerHTML = '';
    mrps.forEach((m) => { const o = document.createElement('option'); o.value = m; o.textContent = m; mrpSelect.appendChild(o); });
  }

  companySelect.addEventListener('change', onCompanyChange);

  addToCartBtn.addEventListener('click', () => {
    const company = companySelect.value;
    const product = productSelect.value;
    const mrp = Number(mrpSelect.value);
    const qty = parseInt(quantityInput.value, 10) || 0;
    if (!company || !product || !mrp || qty <= 0) { orderMsg.textContent = 'Select product and valid quantity'; return; }
    const line = mrp * qty;
    cart.push({ company, product, mrp, quantity: qty, line_total: line });
    renderCart();
    orderMsg.textContent = '';
  });

  function renderCart() {
    cartTableBody.innerHTML = '';
    let total = 0;
    cart.forEach((it, idx) => {
      total += it.line_total;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${it.company}</td><td>${it.product}</td><td>${it.mrp}</td><td>${it.quantity}</td><td>${it.line_total}</td>`;
      cartTableBody.appendChild(tr);
    });
    grandTotalEl.textContent = total;
  }

  placeOrderBtn.addEventListener('click', async () => {
    if (cart.length === 0) { orderMsg.textContent = 'Cart empty'; return; }
    const resp = await api('/api/place-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cart }) });
    if (resp.success) {
      orderMsg.textContent = `Order placed successfully. Order ID: ${resp.orderId}. Total: ${resp.total}`;
      cart.length = 0; renderCart();
    } else {
      orderMsg.textContent = resp.error || 'Failed to place order';
    }
  });

})();
>>>>>>> 2cc4507 (Backup all local files before syncing with remote)
