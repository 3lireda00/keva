'use strict';

const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

const WHATSAPP_NUMBER = '201039197703';

function getCart() {
  return JSON.parse(localStorage.getItem('keva_cart') || '[]');
}

function saveCart(cart) {
  localStorage.setItem('keva_cart', JSON.stringify(cart));
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
function addToBulkOrder(button) {
  const card = button.closest('.product-card');
  if (!card) return;

  const productName = card.querySelector('h3')?.innerText.trim() || 'KEVA Perfume';
  const select = card.querySelector('select');
  const qtyEl = card.querySelector('.qty-value');

  const size = select ? select.value : '50ml';
  const quantity = qtyEl ? Number(qtyEl.textContent) || 1 : 1;
  const unitPrice = getSelectedPrice(card);
  const price = unitPrice * quantity;

  const cart = getCart();
  cart.push({ name: productName, size, quantity, unitPrice, price });
  saveCart(cart);
  updateCartCount();
  showToast(`${productName} added to My Order`);
}


const PRODUCT_DETAILS = {
  'Asia': {
    badge: 'Fresh Floral', rating: '4.8',
    top: 'Red berries, pear, citrus',
    middle: 'Orange blossom, jasmine, lavender',
    base: 'Vanilla, amber, musk',
    mood: 'Fresh. Bright. Feminine. Easy to wear.',
    inspired: 'A modern fruity floral daily signature',
    ingredients: 'Alcohol Denat, Parfum, Aqua, Limonene, Linalool, Citral, Geraniol, Benzyl Benzoate, Alpha-Isomethyl Ionone, BHT',
    description: 'A bright feminine fragrance that blends fruity freshness with soft florals and warm vanilla elegance, creating a playful yet sophisticated signature.'
  },
  'Caramel Mush': {
    badge: 'Sweet Warm', rating: '4.9',
    top: 'Caramel, vanilla',
    middle: 'Musk',
    base: 'Amber, soft woody notes',
    mood: 'Sweet. Cozy. Creamy. Addictive.',
    inspired: 'A caramel gourmand comfort scent',
    ingredients: 'Alcohol Denat, Parfum, Aqua, Coumarin, Linalool, Benzyl Salicylate, Benzyl Benzoate, Vanillin, Cinnamal, BHT',
    description: 'A warm sweet musk fragrance wrapped in creamy caramel softness, creating a cozy and addictive scent with a smooth elegant touch.'
  },
  'La Belle': {
    badge: 'Vanilla Fruity', rating: '4.8',
    top: 'Pear, bergamot',
    middle: 'Vanilla, floral notes',
    base: 'Vetiver, amber',
    mood: 'Sensual. Elegant. Warm. Feminine.',
    inspired: 'La Belle style vanilla fruity elegance',
    ingredients: 'Alcohol Denat, Parfum, Aqua, Limonene, Linalool, Coumarin, Citronellol, Benzyl Alcohol, Benzyl Benzoate, BHT',
    description: 'A sensual and elegant fragrance that combines luscious fruity sweetness with creamy vanilla and warm woody notes, creating an irresistible feminine signature.'
  },
  'Latte Veil': {
    badge: 'Sweet Woody', rating: '4.7',
    top: 'Honey',
    middle: 'Vanilla, caramel',
    base: 'Woody notes',
    mood: 'Warm. Creamy. Comforting. Soft.',
    inspired: 'A latte-inspired sweet woody veil',
    ingredients: 'Alcohol Denat, Parfum, Aqua, Linalool, Benzyl Benzoate, Coumarin, Hexyl Cinnamal, Geraniol, BHT',
    description: 'A warm creamy scent inspired by soft latte sweetness, with smooth vanilla and rich comforting notes.'
  },
  'Marshmallow': {
    badge: 'Sweet Musk', rating: '4.8',
    top: 'Marshmallow, sugar',
    middle: 'Vanilla',
    base: 'Musk, amber, soft woods',
    mood: 'Soft. Sweet. Playful. Clean.',
    inspired: 'A fluffy marshmallow musk fragrance',
    ingredients: 'Alcohol Denat, Parfum, Aqua, Linalool, Coumarin, Geraniol, Benzyl Benzoate, Alpha-Isomethyl Ionone, BHT',
    description: 'A soft sweet musk fragrance inspired by fluffy marshmallow sweetness, blended with creamy warmth and a clean smooth finish.'
  },
  'Miss Gold': {
    badge: 'Best Seller', rating: '4.9',
    top: 'Strawberry, blackcurrant',
    middle: 'Candy accord, caramel',
    base: 'Vanilla, musk, amber',
    mood: 'Golden. Playful. Feminine. Addictive.',
    inspired: 'A rich fruity candy gourmand statement',
    ingredients: 'Alcohol Denat, Parfum, Aqua, Limonene, Linalool, Benzyl Salicylate, Coumarin, Benzyl Benzoate, Citral, BHT',
    description: 'A sweet feminine fragrance inspired by fruity candy notes and creamy gourmand warmth, creating a playful and elegant scent with a soft addictive trail.'
  },
  'Mush Red': {
    badge: 'Red Fruits', rating: '4.9',
    top: 'Pomegranate, red fruits',
    middle: 'Rose',
    base: 'Musk, soft amber',
    mood: 'Fresh. Sensual. Clean. Addictive.',
    inspired: 'A red fruity musk signature',
    ingredients: 'Alcohol Denat, Parfum, Aqua, Limonene, Linalool, Citronellol, Coumarin, Geraniol, Benzyl Benzoate, BHT',
    description: 'A fresh and sensual musk fragrance inspired by juicy red fruits, blending soft sweetness with a clean musky elegance that feels smooth and addictive.'
  },
  'Loup': {
    badge: 'Citrus Aquatic', rating: '4.8',
    top: 'Bergamot, lemon, mint',
    middle: 'Lavender, aquatic notes',
    base: 'White musk, cedarwood, amber',
    mood: 'Fresh. Clean. Aquatic. Refined.',
    inspired: 'A refreshing citrus aquatic signature',
    ingredients: 'Alcohol Denat, Parfum, Aqua, Limonene, Linalool, Citral, Coumarin, Benzyl Benzoate, Eugenol, BHT',
    description: 'A refreshing blend of citrus, aquatic notes, and white musk.'
  },
  'Luana Dorée': {
    badge: 'Fresh Floral', rating: '4.7',
    top: 'Bergamot, mandarin',
    middle: 'Jasmine, orange blossom',
    base: 'Vanilla, musk, sandalwood',
    mood: 'Fresh. Clean. Sophisticated. Airy.',
    inspired: 'French floral citrus elegance',
    ingredients: 'Alcohol Denat, Parfum, Aqua, Limonene, Linalool, Citral, Benzyl Alcohol, Coumarin, Hexyl Cinnamal, BHT',
    description: 'Elegant florals wrapped in soft vanilla and musk.'
  },
  'Oud Majesty': {
    badge: 'Oud Luxury', rating: '4.9',
    top: 'Rose, fruity notes',
    middle: 'Musk, amber',
    base: 'Oud, woody notes',
    mood: 'Mysterious. Warm. Royal. Timeless.',
    inspired: 'A majestic oriental oud profile',
    ingredients: 'Alcohol Denat, Parfum, Aqua, Linalool, Coumarin, Benzyl Benzoate, Eugenol, Cinnamal, Isoeugenol, BHT',
    description: 'A luxurious blend of rose, musk, amber, and rich oud.'
  },
  'Elixir': {
    badge: 'Amber Vanilla', rating: '4.8',
    top: 'Mint, lavender',
    middle: 'Benzoin, honey',
    base: 'Vanilla, tonka bean',
    mood: 'Bold. Warm. Addictive. Unforgettable.',
    inspired: 'A bold aromatic vanilla trail',
    ingredients: 'Alcohol Denat, Parfum, Aqua, Limonene, Linalool, Coumarin, Eugenol, Benzyl Benzoate, Citral, BHT',
    description: 'A bold and addictive fragrance that blends fresh aromatic notes with rich vanilla warmth for a powerful and unforgettable trail.'
  },
  'Tiger Noir': {
    badge: 'Citrus Marine', rating: '4.8',
    top: 'Citrus notes, marine accord',
    middle: 'Amber',
    base: 'Woody notes',
    mood: 'Bold. Fresh. Confident. Powerful.',
    inspired: 'A citrus marine woody signature',
    ingredients: 'Alcohol Denat, Parfum, Aqua, Limonene, Linalool, Citral, Coumarin, Benzyl Salicylate, Geraniol, BHT',
    description: 'A bold and captivating fragrance crafted for confidence and power, blending fresh energy with deep woody warmth for an unforgettable presence.'
  },
  'Kofian': {
    badge: 'Coffee Vanilla', rating: '4.9',
    top: 'Cardamom, cinnamon',
    middle: 'Coffee, praline',
    base: 'Vanilla',
    mood: 'Warm. Bold. Addictive. Gourmand.',
    inspired: 'Coffee vanilla gourmand warmth',
    ingredients: 'Alcohol Denat, Parfum, Aqua, Coumarin, Linalool, Benzyl Benzoate, Cinnamal, Vanillin, Eugenol, BHT',
    description: 'A rich gourmand fragrance inspired by intense coffee warmth and sweet spicy notes, creating a bold and addictive signature scent.'
  },
  'Libre Intense': {
    badge: 'Floral Amber', rating: '4.8',
    top: 'Mandarin, bergamot',
    middle: 'Lavender, orange blossom, jasmine',
    base: 'Vanilla, tonka bean, amber',
    mood: 'Bold. Elegant. Sensual. Warm.',
    inspired: 'A bold feminine floral amber signature',
    ingredients: 'Alcohol Denat, Parfum, Aqua, Limonene, Linalool, Coumarin, Citral, Geraniol, Benzyl Benzoate, BHT',
    description: 'A bold and elegant feminine fragrance with deep warmth, blending rich florals and smooth vanilla for a powerful, sensual presence.'
  },
  'Vulcain': {
    badge: 'Spicy Amber', rating: '4.7',
    top: 'Pear, cinnamon',
    middle: 'Lavender',
    base: 'Vanilla, amber, tonka bean',
    mood: 'Bold. Sweet. Spicy. Masculine.',
    inspired: 'A spicy amber masculine signature',
    ingredients: 'Alcohol Denat, Parfum, Aqua, Coumarin, Linalool, Cinnamal, Benzyl Benzoate, Eugenol, BHT',
    description: 'A bold and intense fragrance inspired by sweet spicy warmth and deep amber richness, creating a strong masculine signature with an addictive trail.'
  },
  'Soft fire': { image: 'photo/Soft fire.png', prices: { '30ml': 399, '50ml': 649, '100ml': 1099 }, collection: 'Luxury fruity caramel scent' } 
};


const PRODUCT_CATALOG = {
  'Asia': { image: 'photo/Asia.jpg', prices: { '30ml': 399, '50ml': 649, '100ml': 1099 }, collection: 'Soft floral signature' },
  'Caramel Mush': { image: 'photo/Caramel Mush.jpg', prices: { '30ml': 399, '50ml': 649, '100ml': 1099 }, collection: 'Warm caramel gourmand' },
  'La Belle': { image: 'photo men/La Belle.jpg', prices: { '30ml': 399, '50ml': 649, '100ml': 1099 }, collection: 'Vanilla caramel elegance' },
  'Latte Veil': { image: 'photo/Latte Veil.jpg', prices: { '30ml': 399, '50ml': 649, '100ml': 1099 }, collection: 'Soft honey woods' },
  'Marshmallow': { image: 'photo/Marshmallow.jpg', prices: { '30ml': 399, '50ml': 649, '100ml': 1099 }, collection: 'Sweet musk fragrance' },
  'Miss Gold': { image: 'photo/Miss Gold.jpg', prices: { '30ml': 399, '50ml': 649, '100ml': 1099 }, collection: 'Golden fruity caramel' },
  'Mush Red': { image: 'photo/Mush Red.jpg', prices: { '30ml': 399, '50ml': 649, '100ml': 1099 }, collection: 'Red fruits floral perfume' },
  'Loup': { image: 'photo men/LOUP.png', prices: { '30ml': 399, '50ml': 649, '100ml': 1099 }, collection: 'Elegant warm fragrance' },
  'Oud Majesty': { image: 'photo men/OUD MAJESTY.png', prices: { '30ml': 399, '50ml': 649, '100ml': 1099 }, collection: 'Mysterious oud luxury' },
  'Elixir': { image: 'photo men/Elixir.jpg', prices: { '30ml': 399, '50ml': 649, '100ml': 1099 }, collection: 'Powerful woody amber' },
  'Ligre Noir': { image: 'photo men/Ligre Noir.jpg', prices: { '30ml': 399, '50ml': 649, '100ml': 1099 }, collection: 'Citrus marine woods' },
  'Kofian': { image: 'photo men/Kofian.jpg', prices: { '30ml': 399, '50ml': 649, '100ml': 1099 }, collection: 'Coffee vanilla musk' },
  'Soft fire': { image: 'photo/Soft fire.png', prices: { '30ml': 399, '50ml': 649, '100ml': 1099 }, collection: 'Luxury fruity caramel scent' },
  'vulcain': { image: 'photo men/Vulcain.png', prices: { '30ml': 399, '50ml': 649, '100ml': 1099 }, collection: 'Spicy floral woody fragrance' }

};
function getProductName(card) {
  const title = card?.querySelector('h3');
  return title?.dataset.plain || title?.innerText.trim() || 'KEVA Perfume';
}

function getProductDetails(name) {
  return PRODUCT_DETAILS[name] || {
    badge: 'KEVA Selection',
    rating: '4.8',
    top: 'Fresh opening notes',
    middle: 'Elegant heart notes',
    base: 'Long lasting base notes',
    mood: 'Elegant. Memorable. Refined.',
    inspired: 'KEVA luxury fragrance profile',
    ingredients: 'Alcohol Denat, Parfum, Aqua, Limonene, Linalool, Coumarin, Benzyl Benzoate, BHT',
    description: 'A KEVA fragrance crafted for elegant presence and memorable everyday moments.'
  };
}


function buildProductPayload(card) {
  const name = getProductName(card);
  const img = card.querySelector('img');
  const prices = getProductPrices(card);
  return {
    name,
    image: img?.getAttribute('src') || PRODUCT_CATALOG[name]?.image || '',
    prices: Object.keys(prices).length ? prices : (PRODUCT_CATALOG[name]?.prices || {}),
    selectedSize: card.querySelector('select')?.value || '30ml',
    collection: PRODUCT_CATALOG[name]?.collection || card.querySelector('p')?.innerText.trim() || '',
    details: getProductDetails(name)
  };
}

function goToProductPage(card) {
  if (!card) return;
  const payload = buildProductPayload(card);
  sessionStorage.setItem('keva_selected_product', JSON.stringify(payload));
  location.href = `product.html?name=${encodeURIComponent(payload.name)}`;
}
function ensureProductDetailsModal() {
  let modal = document.getElementById('productDetailsModal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'productDetailsModal';
  modal.className = 'product-details-backdrop';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = `
    <div class="product-details-modal">
      <button class="product-details-close" type="button" aria-label="Close" onclick="closeProductDetails()">x</button>
      <div class="product-details-media"><img id="pdImage" src="" alt=""/></div>
      <div class="product-details-content">
        <div class="pd-title-row"><div><span id="pdBadge" class="pd-badge"></span><h2 id="pdName"></h2></div><div class="pd-rating"><span id="pdRating">4.8</span> ★</div></div>
        <div class="pd-offer"><strong>Buy 2 Get 1</strong><span>Anniversary offer on all Eau de Parfum selections.</span></div>
        <div class="pd-pillars"><div><strong>FR</strong><span>French Crafted Mood</span></div><div><strong>EDP</strong><span>Eau de Parfum</span></div><div><strong>12h+</strong><span>Long Lasting Feel</span></div></div>
        <div class="pd-buy-row"><label>Size</label><select id="pdSize"></select></div>
        <div class="pd-buy-row"><label>Quantity</label><div class="qty-control pd-qty-control"><button type="button" onclick="changeProductDetailsQty(-1)">−</button><span id="pdQty">1</span><button type="button" onclick="changeProductDetailsQty(1)">+</button></div></div>
        <div class="pd-total-row"><span>Total</span><strong><span id="pdTotal">0</span> EGP</strong></div>
        <div class="pd-notes"><p><strong>Top:</strong> <span id="pdTop"></span></p><p><strong>Middle:</strong> <span id="pdMiddle"></span></p><p><strong>Base:</strong> <span id="pdBase"></span></p><p><strong>Ingredients:</strong> <span id="pdIngredients"></span></p><p><strong>This perfume is:</strong> <span id="pdMood"></span></p><p><strong>Inspired By:</strong> <span id="pdInspired"></span></p></div>
        <details class="pd-description" open><summary>Description</summary><p id="pdDescription"></p></details>
        <div class="pd-actions"><button type="button" class="add-btn" onclick="orderFromProductDetails()">Order via WhatsApp</button><button type="button" class="bulk-order-btn" onclick="addDetailsToBulkOrder()">Add to My Order</button></div>
      </div>
    </div>`;
  modal.addEventListener('click', event => {
    if (event.target === modal) closeProductDetails();
  });
  document.body.appendChild(modal);
  return modal;
}

let activeDetailsCard = null;

function openProductDetails(buttonOrCard) {
  const card = buttonOrCard.closest ? buttonOrCard.closest('.product-card') : buttonOrCard;
  goToProductPage(card);
}

function closeProductDetails() {
  const modal = document.getElementById('productDetailsModal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = '';
  activeDetailsCard = null;
}

function getDetailsUnitPrice() {
  if (!activeDetailsCard) return 0;
  const prices = getProductPrices(activeDetailsCard);
  const size = $('pdSize')?.value;
  return Number(prices[size] || activeDetailsCard.dataset.price || 0);
}

function refreshProductDetailsTotal() {
  const qty = Number($('pdQty')?.textContent) || 1;
  const totalEl = $('pdTotal');
  if (totalEl) totalEl.textContent = (getDetailsUnitPrice() * qty).toLocaleString();
}

function changeProductDetailsQty(step) {
  const qtyEl = $('pdQty');
  if (!qtyEl) return;
  let qty = Number(qtyEl.textContent) || 1;
  qty += step;
  if (qty < 1) qty = 1;
  qtyEl.textContent = qty;
  refreshProductDetailsTotal();
}

function syncDetailsSelectionToCard() {
  if (!activeDetailsCard) return;
  const cardSelect = activeDetailsCard.querySelector('select');
  const size = $('pdSize')?.value;
  if (cardSelect && size) {
    cardSelect.value = size;
    updateProductPrice(activeDetailsCard);
  }
}

function orderFromProductDetails() {
  if (!activeDetailsCard) return;
  const card = activeDetailsCard;
  const qty = Number($('pdQty')?.textContent) || 1;
  syncDetailsSelectionToCard();
  closeProductDetails();
  openOrderModal(card.querySelector('.add-btn') || card);
  const qtyEl = $('omQtyValue');
  if (qtyEl) qtyEl.textContent = qty;
  refreshModalTotal();
}

function addDetailsToBulkOrder() {
  if (!activeDetailsCard) return;
  const name = getProductName(activeDetailsCard);
  const size = $('pdSize')?.value || '30ml';
  const quantity = Number($('pdQty')?.textContent) || 1;
  const unitPrice = getDetailsUnitPrice();
  const price = unitPrice * quantity;
  const cart = getCart();
  cart.push({ name, size, quantity, unitPrice, price });
  saveCart(cart);
  updateCartCount();
  showToast(`${name} added to My Order`);
  closeProductDetails();
}

function initProductDetails() {
  $$('.product-card').forEach(card => {
    card.addEventListener('click', event => {
      if (event.target.closest('button, select, a, input, textarea')) return;
      openProductDetails(card);
    });
  });
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


let productPageProduct = null;

function getProductFromUrl() {
  const name = new URLSearchParams(location.search).get('name') || '';
  let stored = null;
  try { stored = JSON.parse(sessionStorage.getItem('keva_selected_product') || 'null'); } catch { stored = null; }
  if (stored && (!name || stored.name === name)) return stored;

  const key = PRODUCT_CATALOG[name] ? name : Object.keys(PRODUCT_CATALOG)[0];
  return {
    name: key,
    image: PRODUCT_CATALOG[key].image,
    prices: PRODUCT_CATALOG[key].prices,
    selectedSize: '50ml',
    collection: PRODUCT_CATALOG[key].collection,
    details: getProductDetails(key)
  };
}

function initProductDetailPage() {
  const page = document.getElementById('productDetailPage');
  if (!page) return;

  productPageProduct = getProductFromUrl();
  const p = productPageProduct;
  document.title = `${p.name} - KEVA`;

  $('productHeroImage').src = p.image;
  $('productHeroImage').alt = p.name;
  $('productThumbMain').src = p.image;
  $('productCollection').textContent = p.collection || p.details.inspired;
  $('productTitle').textContent = `${p.name} - ${p.selectedSize}`;
  $('productRating').textContent = p.details.rating;
  $('productTop').textContent = p.details.top;
  $('productMiddle').textContent = p.details.middle;
  $('productBase').textContent = p.details.base;
  $('productIngredients').textContent = p.details.ingredients;
  $('productMood').textContent = p.details.mood;
  $('productInspired').textContent = p.details.inspired;
  $('productDescription').textContent = p.details.description;

  const sizeSelect = $('productSize');
  sizeSelect.innerHTML = '';
  Object.keys(p.prices).forEach(size => {
    const option = document.createElement('option');
    option.value = size;
    option.textContent = `${size} - ${Number(p.prices[size]).toLocaleString()} EGP`;
    if (size === p.selectedSize) option.selected = true;
    sizeSelect.appendChild(option);
  });
  sizeSelect.addEventListener('change', refreshProductPagePrice);
  refreshProductPagePrice();
}

function getProductPageUnitPrice() {
  const size = $('productSize')?.value || productPageProduct?.selectedSize || '30ml';
  return Number(productPageProduct?.prices?.[size] || 0);
}

function refreshProductPagePrice() {
  const size = $('productSize')?.value || '30ml';
  const unit = getProductPageUnitPrice();
  const qty = Number($('productQty')?.textContent) || 1;
  $('productTitle').textContent = `${productPageProduct.name} - ${size}`;
  $('productPrice').textContent = unit.toLocaleString();
  $('productTotal').textContent = (unit * qty).toLocaleString();
}

function changeProductPageQty(step) {
  const qtyEl = $('productQty');
  if (!qtyEl) return;
  let qty = Number(qtyEl.textContent) || 1;
  qty += step;
  if (qty < 1) qty = 1;
  qtyEl.textContent = qty;
  refreshProductPagePrice();
}

function addProductPageToCart() {
  if (!productPageProduct) return;
  const size = $('productSize')?.value || '30ml';
  const quantity = Number($('productQty')?.textContent) || 1;
  const unitPrice = getProductPageUnitPrice();
  const cart = getCart();
  cart.push({ name: productPageProduct.name, size, quantity, unitPrice, price: unitPrice * quantity });
  saveCart(cart);
  updateCartCount();
  showToast(`${productPageProduct.name} added to My Order`);
}

function orderProductPageWhatsApp() {
  if (!productPageProduct) return;
  const size = $('productSize')?.value || '30ml';
  const quantity = Number($('productQty')?.textContent) || 1;
  const unitPrice = getProductPageUnitPrice();
  const total = unitPrice * quantity;
  const message = `*KEVA Order*\n\n*Product:* ${productPageProduct.name}\n*Size:* ${size}\n*Quantity:* ${quantity}\n*Unit Price:* ${unitPrice.toLocaleString()} EGP\n*Total:* ${total.toLocaleString()} EGP\n\nSent from KEVA Website`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
}
initProductPrices();
initProductDetails();
initProductDetailPage();
updateCartCount();
function scrollFeedback(direction) {
  const track = document.getElementById('feedbackTrack');
  if (!track) return;

  const amount = track.clientWidth * 0.85;
  track.scrollBy({
    left: amount * direction,
    behavior: 'smooth'
  });
}
// KEVA Luxury Motion Pack
(function initKevaLuxuryMotion() {
  const loader = document.querySelector('.luxury-loader');

  // Only lock scroll while "loading" if there is an actual loader overlay
  // shown to the user. Without it, overflow:hidden just freezes scroll
  // with no visual explanation, which feels like a broken/heavy page.
  if (loader) {
    document.body.classList.add('is-loading');
    window.addEventListener('load', () => {
      setTimeout(() => {
        loader.classList.add('hide');
        document.body.classList.remove('is-loading');
      }, 2400);
    });
  }

  const revealTargets = document.querySelectorAll('.product-card, .feature, .feedback-shot, .faq-item, .fragrance-notes, .notes-list');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

  revealTargets.forEach((el, index) => {
    el.style.animationDelay = `${Math.min(index % 6, 5) * 70}ms`;
    observer.observe(el);
  });

  document.querySelectorAll('.product-card h3').forEach((title) => {
    if (title.dataset.animated === 'true') return;
    const text = title.textContent.trim();
    title.dataset.plain = text;
    title.dataset.animated = 'true';
    title.innerHTML = text.split('').map((char, index) => {
      const safe = char === ' ' ? '&nbsp;' : char;
      return `<span class="char" style="--i:${index}">${safe}</span>`;
    }).join('');
  });

  document.querySelectorAll('.fragrance-note, .notes-list li').forEach((item, index) => {
    item.style.setProperty('--i', index % 8);
  });

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      document.documentElement.style.setProperty('--keva-parallax', `${window.scrollY * -0.035}px`);
      ticking = false;
    });
  }, { passive: true });
})();


