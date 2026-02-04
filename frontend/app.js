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

  // ---------------- API helper ----------------
  async function api(path, opts) {
    const res = await fetch(path, Object.assign({ credentials: 'include' }, opts));
    return res.json();
  }

  // ---------------- cart persistence ----------------
  function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  function loadCart() {
    const saved = localStorage.getItem('cart');
    if (!saved) return;

    try {
      const arr = JSON.parse(saved);
      cart.length = 0;
      arr.forEach(i => cart.push(i));
      renderCart();
    } catch (e) {}
  }

  function showLastOrderMessage() {
    const last = localStorage.getItem('lastOrder');
    if (!last) return;

    try {
      const data = JSON.parse(last);
      orderMsg.textContent =
        `Last order placed successfully (Order ID: ${data.orderId}, Total: ${data.total}). You can place a new order.`;
    } catch (e) {}
  }

  // ---------------- SEND OTP ----------------
  sendBtn.addEventListener('click', async () => {

    if (sendBtn.disabled) return;
    sendBtn.disabled = true;

    loginMsg.textContent = '';

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();

    if (!name || !email) {
      loginMsg.textContent = 'Name and email required';
      sendBtn.disabled = false;
      return;
    }

    try {
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
    } catch (e) {
      loginMsg.textContent = 'Network error';
    }

    sendBtn.disabled = false;
  });

  // ---------------- VERIFY OTP ----------------
  verifyBtn.addEventListener('click', async () => {

    if (verifyBtn.disabled) return;
    verifyBtn.disabled = true;

    loginMsg.textContent = '';

    const email = emailInput.value.trim();
    const otp = otpInput.value.trim();

    if (!email || !otp) {
      loginMsg.textContent = 'Email and OTP required';
      verifyBtn.disabled = false;
      return;
    }

    try {
      const resp = await api('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      if (resp.success) {
        loginView.style.display = 'none';
        orderView.style.display = 'block';
        await fetchCatalog();
        loadCart();
        showLastOrderMessage();
      } else {
        loginMsg.textContent = resp.error || 'OTP verification failed';
      }
    } catch (e) {
      loginMsg.textContent = 'Network error';
    }

    verifyBtn.disabled = false;
  });

  // ---------------- check session on load ----------------
  (async function checkLoginOnLoad() {
    try {
      const res = await fetch('/api/me', { credentials: 'include' });
      const data = await res.json();

      if (data.loggedIn) {
        loginView.style.display = 'none';
        orderView.style.display = 'block';
        await fetchCatalog();
        loadCart();
        showLastOrderMessage();
      }
    } catch (e) {}
  })();

  // ---------------- products ----------------
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

  // ---------------- cart ----------------
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

    cart.push({
      company,
      product,
      mrp,
      quantity: qty,
      line_total: line
    });

    renderCart();
    saveCart();
    orderMsg.textContent = '';
  });

  function renderCart() {
    cartTableBody.innerHTML = '';

    let total = 0;

    cart.forEach((it) => {
      total += it.line_total;

      const tr = document.createElement('tr');
      tr.innerHTML =
        `<td>${it.company}</td>
         <td>${it.product}</td>
         <td>${it.mrp}</td>
         <td>${it.quantity}</td>
         <td>${it.line_total}</td>`;

      cartTableBody.appendChild(tr);
    });

    grandTotalEl.textContent = total;
  }

  // ---------------- place order ----------------
  placeOrderBtn.addEventListener('click', async () => {

    if (placeOrderBtn.disabled) return;
    placeOrderBtn.disabled = true;

    if (cart.length === 0) {
      orderMsg.textContent = 'Cart empty';
      placeOrderBtn.disabled = false;
      return;
    }

    try {
      const resp = await api('/api/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart }),
      });

      if (resp.success) {

        localStorage.removeItem('cart');

        localStorage.setItem('lastOrder', JSON.stringify({
          orderId: resp.orderId,
          total: resp.total,
          time: Date.now()
        }));

        orderMsg.textContent =
          `Order placed successfully. Order ID: ${resp.orderId}. Total: ${resp.total}`;

        cart.length = 0;
        renderCart();

      } else {
        orderMsg.textContent = resp.error || 'Failed to place order';
      }

    } catch (e) {
      orderMsg.textContent = 'Network error';
    }

    placeOrderBtn.disabled = false;
  });

})();