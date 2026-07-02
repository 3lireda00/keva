'use strict';

const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

const WHATSAPP_NUMBER = '201096169882';

function getCart() {
  return JSON.parse(localStorage.getItem('keva_cart') || '[]');
}

function updateCartCount() {
  const count = getCart().length;
  $$('#cart-count').forEach(el => {
    el.textContent = count;
  });
}

function showToast(msg) {
  let toast = document.querySelector('.toast');

  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast-icon">*</span><span class="toast-msg"></span>`;
    document.body.appendChild(toast);
  }

  toast.querySelector('.toast-msg').textContent = msg;
  toast.classList.add('show');

  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 2800);
}

function getProductPrices(card) {
  try {
    return JSON.parse(card.dataset.prices || '{}');
  } catch {
    return {};
  }
}

function getSelectedPrice(card) {
  const select = card.querySelector('select');
  const size = select ? select.value : '50ml';
  const prices = getProductPrices(card);

  return Number(prices[size] || card.dataset.price || 0);
}

function updateProductPrice(card) {
  const priceEl = card.querySelector('.price');
  if (!priceEl) return;

  const price = getSelectedPrice(card);
  priceEl.innerHTML = `${price.toLocaleString()} <small>EGP</small>`;
}

function initProductPrices() {
  $$('.product-card').forEach(card => {
    updateProductPrice(card);

    const select = card.querySelector('select');
    if (select) {
      select.addEventListener('change', () => updateProductPrice(card));
    }
  });
}

function changeQty(button, step) {
  const control = button.closest('.qty-control');
  if (!control) return;

  const valueEl = control.querySelector('.qty-value');
  let value = Number(valueEl.textContent) || 1;

  value += step;
  if (value < 1) value = 1;

  valueEl.textContent = value;
}

let activeOrderCard = null;

function openOrderModal(button) {
  activeOrderCard = button.closest('.product-card');
  if (!activeOrderCard) return;

  const modal = $('orderModal');
  if (!modal) {
    sendDirectWhatsApp(activeOrderCard);
    return;
  }

  const productName = activeOrderCard.querySelector('h3')?.innerText.trim() || 'KEVA Perfume';
  const description = activeOrderCard.querySelector('p')?.innerText.trim() || '';
  const cardSelect = activeOrderCard.querySelector('select');
  const cardSize = cardSelect ? cardSelect.value : '50ml';
  const cardQty = Number(activeOrderCard.querySelector('.qty-value')?.textContent) || 1;
  const prices = getProductPrices(activeOrderCard);

  $('omProductName').textContent = productName;
  $('omProductMeta').textContent = description;
  $('omQtyValue').textContent = cardQty;

  const sizeSelect = $('omSizeSelect');
  sizeSelect.innerHTML = '';

  Object.keys(prices).forEach(size => {
    const option = document.createElement('option');
    option.value = size;
    option.textContent = `${size} - ${Number(prices[size]).toLocaleString()} EGP`;
    if (size === cardSize) option.selected = true;
    sizeSelect.appendChild(option);
  });

  if (!Object.keys(prices).length) {
    const option = document.createElement('option');
    option.value = cardSize;
    option.textContent = cardSize;
    sizeSelect.appendChild(option);
  }

  sizeSelect.onchange = refreshModalTotal;

  refreshModalTotal();

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeOrderModal() {
  const modal = $('orderModal');
  if (modal) modal.classList.remove('open');

  document.body.style.overflow = '';
  activeOrderCard = null;
}

function changeModalQty(step) {
  const qtyEl = $('omQtyValue');
  if (!qtyEl) return;

  let qty = Number(qtyEl.textContent) || 1;
  qty += step;
  if (qty < 1) qty = 1;

  qtyEl.textContent = qty;
  refreshModalTotal();
}

function getModalUnitPrice() {
  if (!activeOrderCard) return 0;

  const prices = getProductPrices(activeOrderCard);
  const size = $('omSizeSelect')?.value;

  return Number(prices[size] || activeOrderCard.dataset.price || 0);
}

function refreshModalTotal() {
  const totalEl = $('omTotal');
  if (!totalEl) return;

  const unitPrice = getModalUnitPrice();
  const qty = Number($('omQtyValue')?.textContent) || 1;
  const total = unitPrice * qty;

  totalEl.textContent = total.toLocaleString();
}

function submitOrder() {
  if (!activeOrderCard) return;

  const customerName = $('omName')?.value.trim();
  const customerPhone = $('omPhone')?.value.trim();
  const notes = $('omNotes')?.value.trim();

  if (!customerName || !customerPhone) {
    showToast('Please enter your name and phone number.');
    return;
  }

  const productName = $('omProductName')?.textContent.trim() || 'KEVA Perfume';
  const size = $('omSizeSelect')?.value || '50ml';
  const qty = Number($('omQtyValue')?.textContent) || 1;
  const unitPrice = getModalUnitPrice();
  const total = unitPrice * qty;

  const message =
`*KEVA Order*

*Product:* ${productName}
*Size:* ${size}
*Quantity:* ${qty}
*Unit Price:* ${unitPrice.toLocaleString()} EGP
*Total:* ${total.toLocaleString()} EGP

*Customer Name:* ${customerName}
*Phone:* ${customerPhone}
*Notes:* ${notes || 'No notes'}

Sent from KEVA Website`;

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  window.open(whatsappUrl, '_blank');
  closeOrderModal();
}

function sendDirectWhatsApp(card) {
  const productName = card.querySelector('h3')?.innerText.trim() || 'KEVA Perfume';
  const select = card.querySelector('select');
  const qtyEl = card.querySelector('.qty-value');

  const size = select ? select.value : '50ml';
  const qty = qtyEl ? Number(qtyEl.textContent) || 1 : 1;
  const unitPrice = getSelectedPrice(card);
  const total = unitPrice * qty;

  const message =
`*KEVA Order*

*Product:* ${productName}
*Size:* ${size}
*Quantity:* ${qty}
*Unit Price:* ${unitPrice.toLocaleString()} EGP
*Total:* ${total.toLocaleString()} EGP

Sent from KEVA Website`;

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
}

function addToCart(button) {
  openOrderModal(button);
}

(function markActiveLink() {
  const path = location.pathname.split('/').pop() || 'index.html';

  $$('nav a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
})();

(function initHamburger() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('nav');

  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('header')) {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
})();

(function initSlider() {
  const slides = $$('.slide');
  const dots = $$('.slider-dot');
  const prevBtn = document.querySelector('.slider-btn.prev');
  const nextBtn = document.querySelector('.slider-btn.next');

  if (!slides.length) return;

  let current = 0;
  let timer;

  function goTo(index) {
    slides[current].classList.remove('active');
    if (dots[current]) dots[current].classList.remove('active');

    current = (index + slides.length) % slides.length;

    slides[current].classList.add('active');
    if (dots[current]) dots[current].classList.add('active');
  }

  function startAuto() {
    timer = setInterval(() => goTo(current + 1), 5000);
  }

  function resetAuto() {
    clearInterval(timer);
    startAuto();
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      goTo(current - 1);
      resetAuto();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      goTo(current + 1);
      resetAuto();
    });
  }

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      goTo(index);
      resetAuto();
    });
  });

  startAuto();
})();

document.addEventListener('click', e => {
  if (e.target.id === 'orderModal') {
    closeOrderModal();
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeOrderModal();
  }
});

initProductPrices();
updateCartCount();