(() => {
  "use strict";

  const STORAGE_KEY = "supremeDetailingBookingsV1";
  const CART_KEY = "supremeDetailingCartV1";
  const ADMIN_PIN = "1234";
  const priceMap = {
    "Basic Wash": "PKR 3,999",
    "Premium Detail": "PKR 8,999",
    "Ceramic Pro": "PKR 24,999",
    "Custom / Add-ons": "Quote after review"
  };

  const customerView = document.getElementById("customerView");
  const adminView = document.getElementById("adminView");
  const footer = document.querySelector(".footer");
  const bookingForm = document.getElementById("bookingForm");
  const trackingForm = document.getElementById("trackingForm");
  const trackingResult = document.getElementById("trackingResult");
  const adminLogin = document.getElementById("adminLogin");
  const adminDashboard = document.getElementById("adminDashboard");
  const adminLoginForm = document.getElementById("adminLoginForm");
  const packageSelect = document.getElementById("packageSelect");
  const bookingDate = document.getElementById("bookingDate");
  const addressField = document.getElementById("addressField");
  const mobileLocationFields = document.getElementById("mobileLocationFields");
  const toast = document.getElementById("toast");
  let activeBookingId = null;
  let toastTimer = null;

  const loader = document.getElementById("loader");
  const siteHeader = document.getElementById("siteHeader");
  const scrollProgress = document.getElementById("scrollProgress");
  const cursorGlow = document.getElementById("cursorGlow");
  const motionAllowed = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const finishLoading = () => window.setTimeout(() => loader?.classList.add("is-hidden"), 450);
  window.addEventListener("load", finishLoading, { once: true });
  window.setTimeout(finishLoading, 2400);

  const updatePageMotion = () => {
    const scrollTop = window.scrollY;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollProgress) scrollProgress.style.width = `${scrollable > 0 ? (scrollTop / scrollable) * 100 : 0}%`;
    siteHeader?.classList.toggle("scrolled", scrollTop > 30);
    if (!motionAllowed) return;
    document.querySelectorAll("[data-parallax]").forEach(element => {
      const rect = element.parentElement.getBoundingClientRect();
      const strength = Number(element.dataset.parallax || .08);
      const offset = Math.max(-85, Math.min(85, (window.innerHeight / 2 - rect.top - rect.height / 2) * strength));
      element.style.transform = `translate3d(0, ${offset}px, 0) scale(1.03)`;
    });
  };
  window.addEventListener("scroll", updatePageMotion, { passive: true });
  updatePageMotion();

  if (motionAllowed && window.matchMedia("(pointer:fine)").matches) {
    window.addEventListener("pointermove", event => {
      if (cursorGlow) cursorGlow.style.transform = `translate3d(${event.clientX - 210}px, ${event.clientY - 210}px, 0)`;
    }, { passive: true });
  }

  const readBookings = () => {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };

  const writeBookings = (bookings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  };

  const readServiceCart = () => {
    try {
      const data = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(data) ? data.filter(item => item && item.id && item.qty > 0) : [];
    } catch {
      return [];
    }
  };

  const serviceCartTotal = cart => cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0);
  const formatMoney = value => `PKR ${Number(value || 0).toLocaleString("en-PK")}`;

  const cleanPhone = (value) => String(value || "").replace(/\D/g, "");
  const escapeHTML = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  }[char]));

  const makeBookingId = () => {
    const highest = readBookings().reduce((max, booking) => {
      const number = Number(String(booking.id || "").replace(/\D/g, ""));
      return Number.isFinite(number) ? Math.max(max, number) : max;
    }, 0);
    return `SD-${String(highest + 1).padStart(4, "0")}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not selected";
    const date = new Date(`${dateString}T12:00:00`);
    return Number.isNaN(date.getTime()) ? dateString : new Intl.DateTimeFormat("en-PK", {
      day: "numeric", month: "short", year: "numeric"
    }).format(date);
  };

  const getInitials = (name) => String(name || "Guest").split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  const statusClass = (status) => `status-${String(status).toLowerCase()}`;

  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
  };

  const openModal = (id) => {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    window.setTimeout(() => modal.querySelector("button, input, textarea")?.focus(), 30);
  };

  const closeModal = (id) => {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.hidden = true;
    if (!document.querySelector(".modal-backdrop:not([hidden])")) document.body.classList.remove("modal-open");
  };

  const setView = (view, shouldScroll = true) => {
    const isAdmin = view === "admin";
    customerView.classList.toggle("is-active", !isAdmin);
    adminView.classList.toggle("is-active", isAdmin);
    document.body.classList.toggle("admin-mode", isAdmin);
    if (footer) footer.hidden = isAdmin;
    document.getElementById("navLinks")?.classList.remove("open");
    document.getElementById("menuToggle")?.setAttribute("aria-expanded", "false");
    if (isAdmin) {
      showAdminState();
      history.replaceState(null, "", "#admin");
    } else {
      history.replaceState(null, "", "#home");
    }
    if (shouldScroll) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showAdminState = () => {
    const loggedIn = sessionStorage.getItem("supremeAdminAuth") === "yes";
    adminLogin.hidden = loggedIn;
    adminDashboard.hidden = !loggedIn;
    if (loggedIn) renderAdmin();
  };

  const scrollCustomerTo = (id) => {
    setView("customer", false);
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
  };

  document.querySelectorAll("[data-view-link]").forEach(button => {
    button.addEventListener("click", () => setView(button.dataset.viewLink));
  });

  document.querySelectorAll("[data-scroll-to]").forEach(button => {
    button.addEventListener("click", () => scrollCustomerTo(button.dataset.scrollTo));
  });

  document.querySelectorAll("[data-customer-link]").forEach(link => {
    link.addEventListener("click", () => {
      if (!customerView.classList.contains("is-active")) setView("customer", false);
      document.getElementById("navLinks")?.classList.remove("open");
    });
  });

  const menuToggle = document.getElementById("menuToggle");
  menuToggle?.addEventListener("click", () => {
    const links = document.getElementById("navLinks");
    const isOpen = links.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.querySelectorAll(".package-select").forEach(button => {
    button.addEventListener("click", () => {
      const selected = button.closest("[data-package]")?.dataset.package;
      if (selected) {
        packageSelect.value = selected;
        updateEstimate();
      }
      scrollCustomerTo("booking");
      window.setTimeout(() => bookingForm.elements.name.focus(), 500);
    });
  });

  document.querySelectorAll("[data-package-jump]").forEach(button => {
    button.addEventListener("click", () => {
      packageSelect.value = button.dataset.packageJump;
      updateEstimate();
      scrollCustomerTo("booking");
    });
  });

  const renderBookingOrder = () => {
    const cart = readServiceCart();
    const lines = document.getElementById("bookingOrderLines");
    const empty = document.getElementById("bookingOrderEmpty");
    const totalRow = document.getElementById("bookingOrderTotalRow");
    const amount = serviceCartTotal(cart);
    empty.hidden = cart.length > 0;
    totalRow.hidden = cart.length === 0;
    lines.innerHTML = cart.map(item => `<div class="booking-order-line"><b>${escapeHTML(item.name)}</b><span>${escapeHTML(formatMoney(item.price * item.qty))}</span><small>${item.qty} × ${escapeHTML(formatMoney(item.price))}</small></div>`).join("");
    document.getElementById("bookingOrderTotal").textContent = formatMoney(amount);
    document.getElementById("bookingSubtotal").textContent = formatMoney(amount);
    document.getElementById("estimatePrice").textContent = cart.length ? formatMoney(amount) : "PKR 0";
    packageSelect.value = cart.length ? `${cart.length} selected service${cart.length === 1 ? "" : "s"}` : "Custom Service Order";
  };

  const renderBookingReview = () => {
    const value = (name) => String(bookingForm.elements[name]?.value || "").trim();
    const setReview = (id, text, complete) => {
      const element = document.getElementById(id);
      element.textContent = text;
      element.classList.toggle("is-complete", complete);
    };
    const name = value("name");
    const phone = value("phone");
    const email = value("email");
    const customerParts = [name, phone, email].filter(Boolean);
    setReview("reviewCustomer", customerParts.length ? customerParts.join(" · ") : "Add your name and phone", Boolean(name && phone));

    const vehicle = value("vehicle");
    const vehicleYear = value("vehicleYear");
    const vehicleType = value("vehicleType");
    const registration = value("registration");
    const vehicleParts = [vehicle, vehicleYear, vehicleType, registration].filter(Boolean);
    setReview("reviewVehicle", vehicleParts.length ? vehicleParts.join(" · ") : "Add your vehicle details", Boolean(vehicle && vehicleYear && vehicleType));

    const date = value("date");
    const time = value("time");
    setReview("reviewSchedule", date || time ? [date ? formatDate(date) : "Date not selected", time || "Time not selected"].join(" · ") : "Choose a date and time", Boolean(date && time));

    const serviceType = value("serviceType") || "Mobile service";
    const address = value("address");
    const locationText = serviceType === "Workshop" ? "Supreme Studio · Workshop visit" : `Mobile service · ${address || "Add your complete address"}`;
    setReview("reviewLocation", locationText, serviceType === "Workshop" || Boolean(address));
  };

  bookingForm.addEventListener("input", renderBookingReview);
  bookingForm.addEventListener("change", renderBookingReview);

  const updateEstimate = renderBookingOrder;
  packageSelect.addEventListener("change", updateEstimate);

  const updateAddressRequirement = () => {
    const serviceType = bookingForm.elements.serviceType.value;
    const addressInput = bookingForm.elements.address;
    const mobile = serviceType === "Mobile service";
    mobileLocationFields.hidden = !mobile;
    addressInput.required = mobile;
    if (!mobile) {
      addressInput.value = "Supreme Detailing workshop";
      bookingForm.elements.landmark.value = "";
    }
    if (mobile && addressInput.value === "Supreme Detailing workshop") addressInput.value = "";
    renderBookingReview();
  };
  bookingForm.querySelectorAll("input[name='serviceType']").forEach(input => input.addEventListener("change", updateAddressRequirement));

  const setDateLimits = () => {
    const now = new Date();
    const max = new Date(now);
    max.setDate(max.getDate() + 90);
    const localISO = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };
    bookingDate.min = localISO(now);
    bookingDate.max = localISO(max);
  };

  bookingForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!bookingForm.reportValidity()) return;
    const data = new FormData(bookingForm);
    const selectedServices = readServiceCart();
    const orderTotal = serviceCartTotal(selectedServices);
    if (!selectedServices.length) {
      showToast("Please choose at least one service and build your bill first.");
      document.getElementById("bookingOrderBox").scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const phone = cleanPhone(data.get("phone"));
    if (phone.length < 10 || phone.length > 13) {
      showToast("Please enter a valid phone or WhatsApp number.");
      bookingForm.elements.phone.focus();
      return;
    }
    const booking = {
      id: makeBookingId(),
      name: String(data.get("name")).trim(),
      phone,
      email: String(data.get("email") || "").trim(),
      contactMethod: String(data.get("contactMethod") || "WhatsApp"),
      vehicle: String(data.get("vehicle")).trim(),
      vehicleYear: String(data.get("vehicleYear") || "").trim(),
      vehicleType: String(data.get("vehicleType") || "").trim(),
      vehicleColor: String(data.get("vehicleColor") || "").trim(),
      vehicleCondition: String(data.get("vehicleCondition") || "Standard use").trim(),
      registration: String(data.get("registration") || "").trim(),
      package: `${selectedServices.reduce((sum, item) => sum + item.qty, 0)} selected services`,
      price: formatMoney(orderTotal),
      services: selectedServices.map(item => ({ id:item.id, name:item.name, price:Number(item.price), qty:Number(item.qty) })),
      total: orderTotal,
      serviceType: String(data.get("serviceType")),
      address: String(data.get("address") || "Supreme Detailing workshop").trim(),
      landmark: String(data.get("landmark") || "").trim(),
      date: String(data.get("date")),
      time: String(data.get("time")),
      notes: String(data.get("notes") || "").trim(),
      adminNote: "",
      status: "Pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const bookings = readBookings();
    bookings.unshift(booking);
    writeBookings(bookings);

    document.getElementById("successBookingId").firstChild.textContent = `${booking.id} `;
    document.getElementById("successBookingId").dataset.bookingId = booking.id;
    document.getElementById("successSummary").innerHTML = `
      <div><small>Customer</small><b>${escapeHTML(booking.name)}</b></div>
      <div><small>Estimated total</small><b>${escapeHTML(formatMoney(booking.total))}</b></div>
      <div><small>Vehicle</small><b>${escapeHTML(booking.vehicle)} · ${escapeHTML(booking.vehicleYear)}</b></div>
      <div><small>Requested for</small><b>${escapeHTML(formatDate(booking.date))} · ${escapeHTML(booking.time)}</b></div>`;
    openModal("successModal");
    localStorage.removeItem(CART_KEY);
    bookingForm.reset();
    renderBookingOrder();
    updateAddressRequirement();
    renderBookingReview();
  });

  document.getElementById("successBookingId").addEventListener("click", async (event) => {
    const id = event.currentTarget.dataset.bookingId;
    if (!id) return;
    try {
      await navigator.clipboard.writeText(id);
      showToast("Booking ID copied.");
    } catch {
      showToast(`Your booking ID is ${id}`);
    }
  });

  trackingForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(trackingForm);
    const id = String(data.get("bookingId") || "").trim().toUpperCase();
    const phone = cleanPhone(data.get("phone"));
    const booking = readBookings().find(item => item.id.toUpperCase() === id && cleanPhone(item.phone) === phone);
    trackingResult.classList.add("show");
    if (!booking) {
      trackingResult.innerHTML = `<div class="track-error">We couldn’t find that booking. Check the ID and phone number, then try again.</div>`;
      return;
    }
    const statusMessage = {
      Pending: "Your request is waiting for our team to review it.",
      Confirmed: "Your appointment is confirmed. We look forward to detailing your car!",
      Completed: "This detailing appointment has been completed. Thank you for choosing us.",
      Declined: "We couldn’t confirm this requested slot. Please call us to choose another time."
    }[booking.status] || "Your booking is being updated.";
    const trackedServices = Array.isArray(booking.services) ? booking.services : [];
    trackingResult.innerHTML = `<div class="tracked-order">
      <div class="tracked-head"><h3>${escapeHTML(booking.id)} · ${escapeHTML(booking.package)}</h3><span class="status ${statusClass(booking.status)}">${escapeHTML(booking.status)}</span></div>
      <p><b>${escapeHTML(formatDate(booking.date))}</b> · ${escapeHTML(booking.time)} · ${escapeHTML(booking.vehicle)}${booking.vehicleYear ? ` · ${escapeHTML(booking.vehicleYear)}` : ""}</p>
      <p><b>${escapeHTML(booking.serviceType)}</b> · ${escapeHTML(booking.address)}${booking.landmark ? ` · Near ${escapeHTML(booking.landmark)}` : ""}</p>
      ${trackedServices.length ? `<div class="tracked-services">${trackedServices.map(item => `<div><span>${escapeHTML(item.name)} × ${item.qty}</span><b>${escapeHTML(formatMoney(item.price * item.qty))}</b></div>`).join("")}<strong><span>Estimated total</span><b>${escapeHTML(formatMoney(booking.total))}</b></strong></div>` : ""}
      <p>${escapeHTML(statusMessage)}</p>
      ${booking.adminNote ? `<p><b>Team note:</b> ${escapeHTML(booking.adminNote)}</p>` : ""}
    </div>`;
  });

  adminLoginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const pin = String(new FormData(adminLoginForm).get("pin") || "");
    if (pin !== ADMIN_PIN) {
      showToast("That PIN is not correct. Try 1234 for the demo.");
      adminLoginForm.elements.pin.select();
      return;
    }
    sessionStorage.setItem("supremeAdminAuth", "yes");
    adminLoginForm.reset();
    showAdminState();
    showToast("Welcome to the booking dashboard.");
  });

  document.getElementById("logoutButton").addEventListener("click", () => {
    sessionStorage.removeItem("supremeAdminAuth");
    showAdminState();
    showToast("You have signed out.");
  });

  document.getElementById("sidebarToggle").addEventListener("click", () => {
    document.querySelector(".sidebar")?.classList.toggle("open");
  });

  document.getElementById("newBookingButton").addEventListener("click", () => { window.location.href = "services.html"; });
  document.getElementById("adminSearch").addEventListener("input", renderAdmin);
  document.getElementById("statusFilter").addEventListener("change", renderAdmin);

  function renderAdmin() {
    const bookings = readBookings();
    const search = document.getElementById("adminSearch").value.trim().toLowerCase();
    const filter = document.getElementById("statusFilter").value;
    const filtered = bookings.filter(booking => {
      const serviceNames = Array.isArray(booking.services) ? booking.services.map(item => item.name).join(" ") : "";
      const searchable = `${booking.id} ${booking.name} ${booking.phone} ${booking.email || ""} ${booking.vehicle} ${booking.vehicleYear || ""} ${booking.vehicleType || ""} ${booking.registration || ""} ${booking.package} ${serviceNames}`.toLowerCase();
      return (!search || searchable.includes(search)) && (filter === "All" || booking.status === filter);
    });

    const pendingCount = bookings.filter(item => item.status === "Pending").length;
    document.getElementById("pendingMetric").textContent = pendingCount;
    document.getElementById("sidebarPending").textContent = pendingCount;
    document.getElementById("confirmedMetric").textContent = bookings.filter(item => item.status === "Confirmed").length;
    document.getElementById("completedMetric").textContent = bookings.filter(item => item.status === "Completed").length;
    document.getElementById("totalMetric").textContent = bookings.length;
    document.getElementById("resultCount").textContent = `${filtered.length} request${filtered.length === 1 ? "" : "s"}`;
    document.getElementById("adminEmpty").hidden = filtered.length > 0;

    const body = document.getElementById("bookingTableBody");
    body.innerHTML = filtered.map(booking => `<tr>
      <td><div class="customer-cell"><span class="customer-initials">${escapeHTML(getInitials(booking.name))}</span><div><span class="cell-main">${escapeHTML(booking.name)}</span><span class="cell-sub">${escapeHTML(booking.phone)}</span></div></div></td>
      <td><span class="cell-main">${escapeHTML(booking.id)}</span><span class="cell-sub">${escapeHTML(booking.vehicle)}</span></td>
      <td><span class="cell-main">${escapeHTML(formatDate(booking.date))}</span><span class="cell-sub">${escapeHTML(booking.time)}</span></td>
      <td><span class="cell-main">${escapeHTML(Array.isArray(booking.services) ? `${booking.services.reduce((sum,item) => sum + item.qty, 0)} services` : booking.package)}</span><span class="cell-sub">${escapeHTML(booking.total ? formatMoney(booking.total) : booking.serviceType)}</span></td>
      <td><span class="status ${statusClass(booking.status)}">${escapeHTML(booking.status)}</span></td>
      <td><button class="row-menu" type="button" data-booking-detail="${escapeHTML(booking.id)}" aria-label="View ${escapeHTML(booking.id)}">•••</button></td>
    </tr>`).join("");
  }

  document.getElementById("bookingTableBody").addEventListener("click", (event) => {
    const button = event.target.closest("[data-booking-detail]");
    if (button) openBookingDetail(button.dataset.bookingDetail);
  });

  const openBookingDetail = (id) => {
    const booking = readBookings().find(item => item.id === id);
    if (!booking) return;
    activeBookingId = id;
    const orderServices = Array.isArray(booking.services) ? booking.services : [];
    const serviceBill = orderServices.length ? `<div class="detail-item full order-detail-bill"><small>Itemized service bill</small>${orderServices.map(item => `<div><span>${escapeHTML(item.name)} × ${item.qty}</span><b>${escapeHTML(formatMoney(item.price * item.qty))}</b></div>`).join("")}<strong><span>Estimated total</span><b>${escapeHTML(formatMoney(booking.total))}</b></strong></div>` : "";
    document.getElementById("bookingDetailContent").innerHTML = `
      <div class="detail-head"><span>${escapeHTML(booking.id)} · ${escapeHTML(booking.status)}</span><h2 id="detailTitle">${escapeHTML(booking.name)}</h2><span class="status ${statusClass(booking.status)}">${escapeHTML(booking.status)}</span></div>
      <div class="detail-grid">
        <div class="detail-item"><small>Phone / preferred contact</small><b>${escapeHTML(booking.phone)} · ${escapeHTML(booking.contactMethod || "WhatsApp")}</b></div>
        <div class="detail-item"><small>Email address</small><b>${escapeHTML(booking.email || "Not provided")}</b></div>
        <div class="detail-item"><small>Vehicle</small><b>${escapeHTML(booking.vehicle)}${booking.vehicleYear ? ` · ${escapeHTML(booking.vehicleYear)}` : ""}${booking.vehicleType ? ` · ${escapeHTML(booking.vehicleType)}` : ""}</b></div>
        <div class="detail-item"><small>Vehicle profile</small><b>${escapeHTML(booking.registration || "No registration")}${booking.vehicleColor ? ` · ${escapeHTML(booking.vehicleColor)}` : ""}${booking.vehicleCondition ? ` · ${escapeHTML(booking.vehicleCondition)}` : ""}</b></div>
        <div class="detail-item"><small>Service order</small><b>${escapeHTML(booking.package)} · ${escapeHTML(booking.price)}</b></div>
        <div class="detail-item"><small>Requested schedule</small><b>${escapeHTML(formatDate(booking.date))} · ${escapeHTML(booking.time)}</b></div>
        <div class="detail-item full"><small>Service location</small><b>${escapeHTML(booking.serviceType)} · ${escapeHTML(booking.address)}${booking.landmark ? ` · Near ${escapeHTML(booking.landmark)}` : ""}</b></div>
        <div class="detail-item full"><small>Customer notes</small><b>${escapeHTML(booking.notes || "No notes provided")}</b></div>
        ${serviceBill}
      </div>
      <label class="field admin-note"><span>Note visible to customer</span><textarea id="adminNoteInput" rows="3" placeholder="Add confirmation or scheduling details...">${escapeHTML(booking.adminNote || "")}</textarea></label>
      <div class="detail-actions">
        ${booking.status === "Pending" || booking.status === "Declined" ? `<button class="button button-success" data-status-action="Confirmed">✓ Confirm booking</button>` : ""}
        ${booking.status === "Confirmed" ? `<button class="button button-success" data-status-action="Completed">✦ Mark completed</button>` : ""}
        ${booking.status !== "Declined" && booking.status !== "Completed" ? `<button class="button button-danger" data-status-action="Declined">Decline</button>` : ""}
        <button class="button button-outline" data-save-note>Save note</button>
        <a class="button button-outline" href="${escapeHTML(makeWhatsAppLink(booking.phone))}" target="_blank" rel="noopener">WhatsApp</a>
      </div>`;
    openModal("bookingDetailModal");
  };

  const makeWhatsAppLink = (phone) => {
    let digits = cleanPhone(phone);
    if (digits.startsWith("0")) digits = `92${digits.slice(1)}`;
    return `https://wa.me/${digits}`;
  };

  document.getElementById("bookingDetailContent").addEventListener("click", (event) => {
    const statusButton = event.target.closest("[data-status-action]");
    const saveButton = event.target.closest("[data-save-note]");
    if (statusButton) updateBooking(activeBookingId, statusButton.dataset.statusAction, true);
    if (saveButton) updateBooking(activeBookingId, null, true);
  });

  const updateBooking = (id, newStatus, saveNote) => {
    const bookings = readBookings();
    const index = bookings.findIndex(item => item.id === id);
    if (index < 0) return;
    if (newStatus) bookings[index].status = newStatus;
    if (saveNote) bookings[index].adminNote = document.getElementById("adminNoteInput")?.value.trim() || "";
    bookings[index].updatedAt = new Date().toISOString();
    writeBookings(bookings);
    renderAdmin();
    closeModal("bookingDetailModal");
    showToast(newStatus ? `${id} is now ${newStatus.toLowerCase()}.` : `Note saved for ${id}.`);
  };

  document.querySelectorAll("[data-close-modal]").forEach(button => {
    button.addEventListener("click", () => closeModal(button.dataset.closeModal));
  });

  document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) closeModal(backdrop.id);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      document.querySelectorAll(".modal-backdrop:not([hidden])").forEach(modal => closeModal(modal.id));
      document.querySelector(".sidebar")?.classList.remove("open");
    }
  });

  const revealObserver = "IntersectionObserver" in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: .12 }) : null;
  document.querySelectorAll(".reveal").forEach(element => revealObserver ? revealObserver.observe(element) : element.classList.add("visible"));

  if ("IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const element = entry.target;
        const target = Number(element.dataset.counter || 0);
        const started = performance.now();
        const tick = now => {
          const progress = Math.min(1, (now - started) / 1200);
          element.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        counterObserver.unobserve(element);
      });
    }, { threshold: .6 });
    document.querySelectorAll("[data-counter]").forEach(element => counterObserver.observe(element));
  }

  if (motionAllowed && window.matchMedia("(pointer:fine)").matches) {
    document.querySelectorAll(".magnetic").forEach(element => {
      element.addEventListener("pointermove", event => {
        const rect = element.getBoundingClientRect();
        element.style.transform = `translate(${(event.clientX - rect.left - rect.width / 2) * .12}px, ${(event.clientY - rect.top - rect.height / 2) * .16}px)`;
      });
      element.addEventListener("pointerleave", () => element.style.transform = "");
    });
    document.querySelectorAll(".tilt-card").forEach(element => {
      element.addEventListener("pointermove", event => {
        const rect = element.getBoundingClientRect();
        const rotateY = ((event.clientX - rect.left) / rect.width - .5) * 3;
        const rotateX = (.5 - (event.clientY - rect.top) / rect.height) * 3;
        element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });
      element.addEventListener("pointerleave", () => element.style.transform = "");
    });
  }

  const dashboardDate = document.getElementById("dashboardDate");
  if (dashboardDate) dashboardDate.textContent = new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  window.addEventListener("storage", () => {
    renderBookingOrder();
    if (!adminDashboard.hidden) renderAdmin();
  });
  window.addEventListener("pageshow", renderBookingOrder);

  setDateLimits();
  updateAddressRequirement();
  updateEstimate();
  if (location.hash === "#admin") setView("admin", false);
  else if (location.hash === "#booking") window.setTimeout(() => document.getElementById("booking")?.scrollIntoView({ behavior: "smooth", block: "start" }), 350);
})();
