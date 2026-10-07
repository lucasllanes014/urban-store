/* ===== URBAN STORE - lógica =====
   Todo lo editable está en CONFIG y PRODUCTS. */
'use strict';

/* ---------- 1. CONFIGURACIÓN ---------- */
const CONFIG = {
  // Número de WhatsApp: código de país + número, SOLO dígitos (ej. Paraguay: 595 + 981123456)
  whatsapp: '595981123456',
  storeName: 'Urban Store',
  storageKey: 'urbanstore-cart'
};

/* ---------- 2. PRODUCTOS DE EJEMPLO ----------
   Para usar fotos propias, cambiá "img" por la ruta (ej. 'img/hoodie.jpg'). */
const U = id => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&h=750&q=70`;
const PRODUCTS = [
  { id: 1, name: 'Remera Oversize',   desc: 'Algodón pesado, corte holgado.',    price: 120000, img: U('photo-1521572163474-6864f9cf17ab') },
  { id: 2, name: 'Hoodie Urban',      desc: 'Canguro con capucha y felpa suave.', price: 220000, img: U('photo-1556821840-3a63f95609a7') },
  { id: 3, name: 'Jean Cargo',        desc: 'Denim resistente con bolsillos.',    price: 250000, img: U('photo-1542272604-787c3835535d') },
  { id: 4, name: 'Campera Street',    desc: 'Liviana y cortaviento.',             price: 280000, img: U('photo-1551028719-00167b16eac5') },
  { id: 5, name: 'Gorra Classic',     desc: 'Visera curva, ajuste regulable.',    price: 90000,  img: U('photo-1588850561407-ed78c282e89b') },
  { id: 6, name: 'Remera Basic',      desc: 'El básico que va con todo.',         price: 100000, img: U('photo-1576566588028-4147f3842f27') },
  { id: 7, name: 'Pantalón Wide Leg', desc: 'Pierna ancha, tiro alto.',           price: 230000, img: U('photo-1624378439575-d8705ad7ae80') },
  { id: 8, name: 'Zapatillas Urban',  desc: 'Suela gruesa, cómodas todo el día.', price: 350000, img: U('photo-1542291026-7eec264c27ff') }
];

/* ---------- 3. UTILIDADES ---------- */
const $ = sel => document.querySelector(sel);
const fmt = n => 'Gs. ' + new Intl.NumberFormat('es-PY').format(n);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const waLink = text => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;
const findProduct = id => PRODUCTS.find(p => p.id === id);

// Imagen de respaldo (SVG) si una foto no carga
const fallbackImg = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750"><rect width="100%" height="100%" fill="#e4e4e1"/><text x="50%" y="50%" fill="#6a6e75" font-family="sans-serif" font-size="32" text-anchor="middle">URBAN STORE</text></svg>';
document.addEventListener('error', e => {
  if (e.target.tagName === 'IMG' && !e.target.dataset.failed) {
    e.target.dataset.failed = '1';
    e.target.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(fallbackImg);
  }
}, true);

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ---------- 4. ESTADO DEL CARRITO ---------- */
let cart = []; // [{ id, qty }]
try { cart = JSON.parse(localStorage.getItem(CONFIG.storageKey)) || []; } catch (e) { cart = []; }
cart = cart.filter(i => findProduct(i.id) && i.qty > 0); // descarta datos inválidos

function saveCart() {
  try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(cart)); } catch (e) { /* modo privado: se ignora */ }
}

function addToCart(id) {
  const item = cart.find(i => i.id === id);
  item ? item.qty++ : cart.push({ id, qty: 1 });
  updateCart();
  toast(findProduct(id).name + ' agregado al carrito');
  const b = $('#cartCount');
  b.classList.add('bump');
  setTimeout(() => b.classList.remove('bump'), 250);
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) return removeFromCart(id);
  updateCart();
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  updateCart();
}

function clearCart() {
  cart = [];
  updateCart();
}

const cartTotal = () => cart.reduce((s, i) => s + findProduct(i.id).price * i.qty, 0);
const cartCount = () => cart.reduce((s, i) => s + i.qty, 0);

/* ---------- 5. RENDER ---------- */
function renderProducts() {
  $('#productGrid').innerHTML = PRODUCTS.map(p => `
    <article class="card">
      <div class="card__img"><img src="${p.img}" alt="${esc(p.name)}" loading="lazy" width="600" height="750"></div>
      <div class="card__body">
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.desc)}</p>
        <div class="price">${fmt(p.price)}</div>
        <div class="card__btns">
          <button class="btn btn--dark" data-add="${p.id}">Agregar al carrito</button>
          <button class="btn btn--line" data-buy="${p.id}">Comprar por WhatsApp</button>
        </div>
      </div>
    </article>`).join('');
}

function updateCart() {
  const list = $('#cartItems');
  if (!cart.length) {
    list.innerHTML = '<li class="empty">Tu carrito está vacío.<br>Agregá productos para armar tu pedido.</li>';
  } else {
    list.innerHTML = cart.map(i => {
      const p = findProduct(i.id);
      return `
      <li class="item">
        <img src="${p.img}" alt="" width="64" height="64">
        <div>
          <h4>${esc(p.name)}</h4>
          <small>${fmt(p.price)} c/u</small>
          <div class="qty">
            <button data-dec="${p.id}" aria-label="Quitar una unidad de ${esc(p.name)}">&minus;</button>
            <span aria-live="polite">${i.qty}</span>
            <button data-inc="${p.id}" aria-label="Agregar una unidad de ${esc(p.name)}">+</button>
          </div>
        </div>
        <div style="text-align:right">
          <strong>${fmt(p.price * i.qty)}</strong><br>
          <button class="item__rm" data-rm="${p.id}" aria-label="Quitar ${esc(p.name)} del carrito">Quitar</button>
        </div>
      </li>`;
    }).join('');
  }
  $('#subtotal').textContent = fmt(cartTotal());
  $('#total').textContent = fmt(cartTotal());
  $('#cartCount').textContent = cartCount();
  $('#cartFoot').hidden = !cart.length;
  saveCart();
}

/* ---------- 6. WHATSAPP ---------- */
function openWhatsApp(text) {
  window.open(waLink(text), '_blank', 'noopener');
}

function checkout() {
  if (!cart.length) return toast('Tu carrito está vacío');
  const lines = cart.map(i => {
    const p = findProduct(i.id);
    return `- ${i.qty} x ${p.name} (${fmt(p.price * i.qty)})`;
  });
  openWhatsApp(`Hola ${CONFIG.storeName}! Quiero hacer este pedido:\n\n${lines.join('\n')}\n\nTotal: ${fmt(cartTotal())}`);
}

/* ---------- 7. PANEL DEL CARRITO Y MENÚ ---------- */
const cartEl = $('#cart'), overlay = $('#overlay'), openBtn = $('#openCart');

function toggleCart(open) {
  cartEl.classList.toggle('open', open);
  cartEl.setAttribute('aria-hidden', String(!open));
  openBtn.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) {
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('show'));
    $('#closeCart').focus();
  } else {
    overlay.classList.remove('show');
    setTimeout(() => { overlay.hidden = true; }, 300);
    openBtn.focus();
  }
}

function toggleMenu(open) {
  $('#menu').classList.toggle('open', open);
  $('#burger').setAttribute('aria-expanded', String(open));
  $('#burger').setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
}

/* ---------- 8. EVENTOS ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-add],[data-buy],[data-inc],[data-dec],[data-rm],[data-wa]');
  if (!t) return;
  if (t.dataset.add) addToCart(+t.dataset.add);
  if (t.dataset.inc) changeQty(+t.dataset.inc, 1);
  if (t.dataset.dec) changeQty(+t.dataset.dec, -1);
  if (t.dataset.rm) removeFromCart(+t.dataset.rm);
  if (t.dataset.buy) {
    const p = findProduct(+t.dataset.buy);
    openWhatsApp(`Hola ${CONFIG.storeName}! Quiero comprar: 1 x ${p.name} (${fmt(p.price)}).`);
  }
  if (t.dataset.wa) { e.preventDefault(); openWhatsApp(t.dataset.wa); }
});

openBtn.addEventListener('click', () => toggleCart(true));
$('#closeCart').addEventListener('click', () => toggleCart(false));
overlay.addEventListener('click', () => toggleCart(false));
$('#checkout').addEventListener('click', checkout);
$('#clearCart').addEventListener('click', clearCart);
$('#burger').addEventListener('click', () => toggleMenu(!$('#menu').classList.contains('open')));
$('#menu').addEventListener('click', e => { if (e.target.tagName === 'A') toggleMenu(false); });

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (cartEl.classList.contains('open')) toggleCart(false);
  toggleMenu(false);
});

window.addEventListener('scroll', () => $('#nav').classList.toggle('scrolled', window.scrollY > 10), { passive: true });

/* ---------- 9. INICIO ---------- */
$('#year').textContent = new Date().getFullYear();
// Muestra el número configurado en la sección de contacto
const n = CONFIG.whatsapp;
$('#waText').textContent = `+${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6, 9)} ${n.slice(9)}`.trim();
renderProducts();
updateCart();
