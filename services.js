(() => {
  "use strict";

  const CART_KEY = "supremeDetailingCartV1";
  const services = [
    { id:"signature-wash", name:"Signature Exterior Wash", category:"Exterior", price:3999, image:"assets/hero-cinematic-v2.png", includes:"Snow foam · Hand wash · Wheel clean · Tyre satin", description:"A paint-safe exterior reset finished carefully by hand." },
    { id:"wheel-detail", name:"Wheel & Tyre Detail", category:"Exterior", price:1800, image:"assets/hero-cover.png", includes:"Brake dust removal · Barrel clean · Tyre dressing", description:"Deep wheel cleaning and a clean satin finish for every tyre." },
    { id:"headlight", name:"Headlight Restoration", category:"Exterior", price:2500, image:"assets/detail-side.png", includes:"Surface correction · Clarity polish · UV protection", description:"Restore clouded headlights for sharper looks and safer nights." },
    { id:"engine-bay", name:"Engine Bay Detail", category:"Exterior", price:2800, image:"assets/gallery-work.png", includes:"Safe degrease · Detail brush · Protective dressing", description:"Controlled cleaning that refreshes the engine bay safely." },
    { id:"interior-deep", name:"Interior Deep Clean", category:"Interior", price:4999, image:"assets/interior-detail-v2.png", includes:"Vacuum · Shampoo · Dashboard · Vents · Mats", description:"A complete cabin reset for seats, carpets and every touchpoint." },
    { id:"steam", name:"Steam Sanitisation", category:"Interior", price:3200, image:"assets/interior-detail-v2.png", includes:"High-temperature steam · Crevices · Hard surfaces", description:"Deep steam treatment for tight areas and frequently touched surfaces." },
    { id:"leather", name:"Leather Clean & Condition", category:"Interior", price:2600, image:"assets/interior-detail-v2.png", includes:"Gentle clean · Conditioning · UV protection", description:"Restore a supple natural finish without greasy residue." },
    { id:"odour", name:"Odour Removal Treatment", category:"Interior", price:2200, image:"assets/services-board.png", includes:"Source treatment · Cabin deodorise · Fresh finish", description:"Target stubborn cabin smells instead of simply covering them." },
    { id:"paint-correction", name:"Paint Correction", category:"Protection", price:8999, image:"assets/ceramic-coating-v2.png", includes:"Paint inspection · Machine polish · Gloss refinement", description:"Reduce swirls and light defects while restoring depth and clarity." },
    { id:"ceramic", name:"Ceramic Coating", category:"Protection", price:24999, image:"assets/ceramic-coating-v2.png", includes:"Full preparation · Ceramic application · Final cure", description:"Long-term hydrophobic protection with dramatic gloss and depth." },
    { id:"glass-coating", name:"Glass Hydrophobic Coating", category:"Protection", price:3000, image:"assets/hero-cinematic-v2.png", includes:"Glass polish · Coating · Water-repellent finish", description:"Improve rain beading and visibility with a slick glass treatment." },
    { id:"paint-sealant", name:"Premium Paint Sealant", category:"Protection", price:4500, image:"assets/ceramic-coating-v2.png", includes:"Surface preparation · Sealant · Gloss finish", description:"A rich glossy protective layer for easier regular maintenance." }
  ];

  const serviceGrid = document.getElementById("serviceGrid");
  const cartLines = document.getElementById("cartLines");
  const emptyCart = document.getElementById("emptyCart");
  const billTotals = document.getElementById("billTotals");
  const orderSummary = document.getElementById("orderSummary");
  const cartBackdrop = document.getElementById("cartBackdrop");
  const toast = document.getElementById("serviceToast");
  let activeCategory = "All";
  let cart = readCart();
  let toastTimer;

  function readCart() {
    try {
      const saved = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(saved) ? saved.filter(item => item && item.id && item.qty > 0) : [];
    } catch {
      return [];
    }
  }

  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  const money = value => `PKR ${Number(value || 0).toLocaleString("en-PK")}`;
  const quantityFor = id => cart.find(item => item.id === id)?.qty || 0;
  const itemCount = () => cart.reduce((sum, item) => sum + item.qty, 0);
  const total = () => cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  function changeQuantity(id, change) {
    const service = services.find(item => item.id === id);
    if (!service) return;
    const existing = cart.find(item => item.id === id);
    if (existing) existing.qty += change;
    else if (change > 0) cart.push({ id:service.id, name:service.name, price:service.price, qty:1, category:service.category });
    cart = cart.filter(item => item.qty > 0);
    saveCart();
    renderAll();
    if (change > 0) showToast(`${service.name} added to your bill.`);
  }

  function renderCatalog() {
    const filtered = activeCategory === "All" ? services : services.filter(service => service.category === activeCategory);
    document.getElementById("catalogLabel").textContent = activeCategory === "All" ? "All services" : activeCategory;
    document.getElementById("catalogCount").textContent = `${filtered.length} treatment${filtered.length === 1 ? "" : "s"}`;
    serviceGrid.innerHTML = filtered.map((service, index) => {
      const qty = quantityFor(service.id);
      return `<article class="catalog-card">
        <div class="catalog-image"><img src="${service.image}" alt="${service.name}"><span class="catalog-category">${service.category}</span><span class="catalog-index">${String(index + 1).padStart(2,"0")}</span></div>
        <div class="catalog-body"><h3>${service.name}</h3><p>${service.description}</p><div class="catalog-includes">${service.includes}</div><div class="catalog-bottom"><div class="catalog-price"><small>Starting from</small><strong>${money(service.price)}</strong></div>
        ${qty ? `<div class="inline-qty"><button data-minus="${service.id}" aria-label="Remove one ${service.name}">−</button><b>${qty}</b><button data-plus="${service.id}" aria-label="Add one ${service.name}">+</button></div>` : `<button class="add-service-button" data-add="${service.id}">+ Add service</button>`}
        </div></div></article>`;
    }).join("");
  }

  function renderCart() {
    const count = itemCount();
    const amount = total();
    emptyCart.hidden = count > 0;
    billTotals.hidden = count === 0;
    cartLines.innerHTML = cart.map(item => `<article class="cart-line"><div><h3>${item.name}</h3><div class="cart-line-price">${money(item.price * item.qty)}</div></div><div class="cart-line-controls"><button data-minus="${item.id}" aria-label="Remove one">−</button><b>${item.qty}</b><button data-plus="${item.id}" aria-label="Add one">+</button><button class="cart-remove" data-remove="${item.id}">Remove</button></div></article>`).join("");
    document.getElementById("cartSubtotal").textContent = money(amount);
    document.getElementById("cartGrandTotal").textContent = money(amount);
    document.getElementById("heroCartTotal").textContent = money(amount);
    document.getElementById("heroCartCount").textContent = count;
    document.getElementById("mobileCartTotal").textContent = money(amount);
    document.getElementById("mobileCartCount").textContent = count;
  }

  function renderAll() {
    renderCatalog();
    renderCart();
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
  }

  function openCart() {
    orderSummary.classList.add("open");
    cartBackdrop.classList.add("show");
  }

  function closeCart() {
    orderSummary.classList.remove("open");
    cartBackdrop.classList.remove("show");
  }

  serviceGrid.addEventListener("click", event => {
    const add = event.target.closest("[data-add]");
    const plus = event.target.closest("[data-plus]");
    const minus = event.target.closest("[data-minus]");
    if (add) changeQuantity(add.dataset.add, 1);
    if (plus) changeQuantity(plus.dataset.plus, 1);
    if (minus) changeQuantity(minus.dataset.minus, -1);
  });

  cartLines.addEventListener("click", event => {
    const plus = event.target.closest("[data-plus]");
    const minus = event.target.closest("[data-minus]");
    const remove = event.target.closest("[data-remove]");
    if (plus) changeQuantity(plus.dataset.plus, 1);
    if (minus) changeQuantity(minus.dataset.minus, -1);
    if (remove) {
      cart = cart.filter(item => item.id !== remove.dataset.remove);
      saveCart();
      renderAll();
    }
  });

  document.getElementById("categoryBar").addEventListener("click", event => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    activeCategory = button.dataset.category;
    document.querySelectorAll("[data-category]").forEach(item => item.classList.toggle("active", item === button));
    renderCatalog();
  });

  document.getElementById("clearCartButton").addEventListener("click", () => {
    if (!cart.length) return;
    cart = [];
    saveCart();
    renderAll();
    showToast("Your service bill has been cleared.");
  });

  document.getElementById("checkoutButton").addEventListener("click", () => {
    if (!cart.length) return showToast("Add at least one service first.");
    saveCart();
    window.location.href = "index.html#booking";
  });

  document.getElementById("mobileCartButton").addEventListener("click", openCart);
  document.getElementById("footerCartButton").addEventListener("click", openCart);
  document.getElementById("keepShoppingButton").addEventListener("click", () => {
    closeCart();
    document.getElementById("serviceMenu").scrollIntoView({behavior:"smooth"});
  });
  cartBackdrop.addEventListener("click", closeCart);
  document.addEventListener("keydown", event => { if (event.key === "Escape") closeCart(); });

  const updateScroll = () => {
    const top = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    document.getElementById("serviceProgress").style.width = `${max > 0 ? top / max * 100 : 0}%`;
    document.getElementById("servicesHeader").classList.toggle("scrolled", top > 24);
  };
  window.addEventListener("scroll", updateScroll, {passive:true});
  window.addEventListener("load", () => setTimeout(() => document.getElementById("serviceLoader").classList.add("hide"), 300), {once:true});
  setTimeout(() => document.getElementById("serviceLoader").classList.add("hide"), 1800);

  renderAll();
  updateScroll();
})();
