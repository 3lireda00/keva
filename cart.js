/* ══════════════════════════════════════════════
   KEVA — cart.js
   ══════════════════════════════════════════════ */

'use strict';

function getCart() {
  return JSON.parse(localStorage.getItem('keva_cart') || '[]');
}
function saveCart(cart) {
  localStorage.setItem('keva_cart', JSON.stringify(cart));
}

function updateCartCount() {
  const count = getCart().length;
  const el = document.getElementById('cart-count');
  if (el) el.textContent = count;
}

function removeItem(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  renderCart();
}

function clearCart() {
  saveCart([]);
  renderCart();
}

function renderCart() {
  const cart    = getCart();
  const tbody   = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total');
  const wrapper = document.querySelector('.cart-wrapper');

  updateCartCount();

  if (!tbody) return;

  if (cart.length === 0) {
    tbody.closest('.cart-table-wrap').style.display = 'none';
    document.querySelector('.cart-total-row').style.display  = 'none';
    document.querySelector('.cart-actions').style.display    = 'none';
    document.querySelector('.cart-empty').style.display      = 'block';
    return;
  }

  // Show table elements
  tbody.closest('.cart-table-wrap').style.display = '';
  document.querySelector('.cart-total-row').style.display = 'flex';
  document.querySelector('.cart-actions').style.display   = 'flex';
  document.querySelector('.cart-empty').style.display     = 'none';

  let sum = 0;
  tbody.innerHTML = '';

  cart.forEach((item, i) => {
    sum += item.price;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-size">${item.size}</div>
      </td>
      <td>${item.size}</td>
      <td><span style="color:var(--gold-light);font-family:'Cormorant Garamond',serif;font-size:18px">${item.price.toLocaleString()} EGP</span></td>
      <td>
        <button class="remove-btn" onclick="removeItem(${i})">Remove</button>
      </td>`;
    tbody.appendChild(tr);
  });

  totalEl.textContent = sum.toLocaleString();
}

// Checkout — sends to WhatsApp (replace number with your own)
function checkout() {
  const cart = getCart();
  if (!cart.length) return;

  const lines = cart.map((item, i) =>
    `${i + 1}. ${item.name} — ${item.size} — ${item.price} EGP`
  ).join('\n');

  const total = cart.reduce((s, i) => s + i.price, 0);
  const msg   = encodeURIComponent(`*KEVA Order*\n\n${lines}\n\n*Total: ${total.toLocaleString()} EGP*`);
  window.open(`https://wa.me/01067571850?text=${msg}`, '_blank');
}

renderCart();