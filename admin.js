/**
 * =============================================================
 *  admin.js — منطق لوحة التحكم
 * =============================================================
 * تُدار كل البيانات هنا عبر window.LocalStore (انظر js/data.js).
 * عند الربط مع Supabase، لن تحتاج لتعديل هذا الملف؛ فقط استبدل
 * تنفيذ دوال LocalStore الداخلية.
 * =============================================================
 */

if (!sessionStorage.getItem("almizan_admin_auth")) {
  location.href = "login.html";
}

document.getElementById("logoutBtn")?.addEventListener("click", (e) => {
  e.preventDefault();
  sessionStorage.removeItem("almizan_admin_auth");
  location.href = "login.html";
});

/* ---------------- الوضع الداكن ---------------- */
function initAdminTheme() {
  const saved = localStorage.getItem("almizan_theme") || "light";
  document.documentElement.setAttribute("data-theme", saved);
  const btn = document.getElementById("themeToggleAdmin");
  btn.textContent = saved === "dark" ? "☀️" : "🌙";
  btn.addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("almizan_theme", next);
    btn.textContent = next === "dark" ? "☀️" : "🌙";
  });
}

/* ---------------- التنقل بين الأقسام ---------------- */
const TAB_TITLES = {
  overview: "نظرة عامة", bookings: "الحجوزات والمواعيد", payments: "المدفوعات",
  lawyers: "المحامون", availability: "الأوقات المتاحة", services: "الخدمات والأسعار",
  clients: "العملاء", articles: "المقالات القانونية", files: "الملفات المرفوعة", ratings: "التقييمات",
};

function initTabs() {
  document.querySelectorAll("#adminNav a").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const tab = a.dataset.tab;
      document.querySelectorAll("#adminNav a").forEach((x) => x.classList.remove("active"));
      a.classList.add("active");
      document.querySelectorAll(".admin-tab-panel").forEach((p) => p.classList.toggle("active", p.dataset.panel === tab));
      document.getElementById("tabTitle").textContent = TAB_TITLES[tab];
      loadTab(tab);
    });
  });
}

function loadTab(tab) {
  const loaders = {
    overview: loadOverview, bookings: loadBookings, payments: loadPayments,
    lawyers: loadLawyers, availability: loadAvailability, services: loadServices,
    clients: loadClients, articles: loadArticles, files: loadFiles, ratings: loadRatings,
  };
  loaders[tab]?.();
}

/* ---------------- نافذة منبثقة عامة ---------------- */
const modalOverlay = document.getElementById("modalOverlay");
function openModal(title, bodyHtml) {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalBody").innerHTML = bodyHtml;
  modalOverlay.classList.add("open");
}
function closeModal() { modalOverlay.classList.remove("open"); }
document.getElementById("modalCloseBtn").addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => { if (e.target === modalOverlay) closeModal(); });

function statusBadge(status) {
  const map = {
    "بانتظار الدفع": "status-pending", "قيد المراجعة": "status-review",
    "مؤكد": "status-confirmed", "ملغي": "status-cancelled",
  };
  return `<span class="status-badge ${map[status] || "status-pending"}">${status}</span>`;
}

/* ---------------- نظرة عامة ---------------- */
async function loadOverview() {
  const [bookings, clients, ratings] = await Promise.all([
    window.LocalStore.getAll("bookings"), window.LocalStore.getAll("clients"), window.LocalStore.getAll("ratings"),
  ]);
  document.getElementById("kpiBookings").textContent = bookings.length;
  document.getElementById("kpiPending").textContent = bookings.filter((b) => b.status === "قيد المراجعة" || b.status === "بانتظار الدفع").length;
  document.getElementById("kpiClients").textContent = clients.length;
  const avg = ratings.length ? (ratings.reduce((s, r) => s + r.stars, 0) / ratings.length).toFixed(1) : "0.0";
  document.getElementById("kpiRating").textContent = avg;

  const recent = [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);
  document.querySelector("#recentBookingsTable tbody").innerHTML = recent.map((b) => `
    <tr><td>${b.clientName}</td><td>${b.specialty}</td><td>${b.lawyerName}</td><td>${b.date} — ${b.time}</td><td>${statusBadge(b.status)}</td></tr>
  `).join("") || `<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">لا توجد حجوزات بعد</td></tr>`;
}

/* ---------------- الحجوزات ---------------- */
let bookingFilter = "الكل";
async function loadBookings() {
  const bookings = (await window.LocalStore.getAll("bookings")).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const list = bookingFilter === "الكل" ? bookings : bookings.filter((b) => b.status === bookingFilter);
  document.querySelector("#bookingsTable tbody").innerHTML = list.map((b) => `
    <tr>
      <td>#${b.id.slice(-5).toUpperCase()}</td><td>${b.clientName}<br><small style="color:var(--text-muted)">${b.clientPhone}</small></td>
      <td>${b.type}</td><td>${b.specialty}</td><td>${b.lawyerName}</td><td>${b.date}<br>${b.time}</td><td>${b.price} ج.م</td><td>${statusBadge(b.status)}</td>
      <td class="row-actions">
        <button data-act="confirm" data-id="${b.id}" title="تأكيد">✔</button>
        <button data-act="cancel" data-id="${b.id}" title="إلغاء">✕</button>
        <button data-act="delete" data-id="${b.id}" title="حذف">🗑</button>
      </td>
    </tr>
  `).join("") || `<tr><td colspan="9" style="text-align:center;color:var(--text-muted)">لا توجد حجوزات مطابقة</td></tr>`;

  document.querySelectorAll("#bookingsTable [data-act]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (btn.dataset.act === "confirm") { await window.LocalStore.update("bookings", id, { status: "مؤكد" }); showToast("تم تأكيد الحجز وإرسال إشعار للعميل (محاكاة n8n)", "success"); }
      if (btn.dataset.act === "cancel") { await window.LocalStore.update("bookings", id, { status: "ملغي" }); showToast("تم إلغاء الحجز", "error"); }
      if (btn.dataset.act === "delete") { if (confirm("هل تريد حذف هذا الحجز نهائيًا؟")) await window.LocalStore.remove("bookings", id); }
      loadBookings();
    });
  });
}

document.querySelectorAll("#bookingStatusFilter .tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#bookingStatusFilter .tab-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    bookingFilter = btn.dataset.status;
    loadBookings();
  });
});

/* ---------------- المدفوعات ---------------- */
async function loadPayments() {
  const [payments, bookings] = await Promise.all([window.LocalStore.getAll("payments"), window.LocalStore.getAll("bookings")]);
  document.querySelector("#paymentsTable tbody").innerHTML = payments.map((p) => {
    const b = bookings.find((x) => x.id === p.bookingId);
    return `<tr>
      <td>#${p.id.slice(-5).toUpperCase()}</td>
      <td>${b ? b.clientName + " — " + b.specialty : "—"}</td>
      <td>${p.amount} ج.م</td>
      <td><a href="${p.receiptBase64}" download="${p.receiptName}" class="btn btn-ghost btn-sm">عرض/تنزيل</a></td>
      <td>${statusBadge(p.status)}</td>
      <td class="row-actions">
        <button data-approve="${p.id}" data-booking="${p.bookingId}">اعتماد ✔</button>
        <button data-reject="${p.id}">رفض ✕</button>
      </td>
    </tr>`;
  }).join("") || `<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">لا توجد مدفوعات بعد</td></tr>`;

  document.querySelectorAll("[data-approve]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await window.LocalStore.update("payments", btn.dataset.approve, { status: "مقبول" });
      await window.LocalStore.update("bookings", btn.dataset.booking, { status: "مؤكد" });
      showToast("تم اعتماد الدفع، وسيتم إرسال رسالة تأكيد تلقائية للعميل عبر n8n", "success");
      loadPayments();
    });
  });
  document.querySelectorAll("[data-reject]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await window.LocalStore.update("payments", btn.dataset.reject, { status: "مرفوض" });
      showToast("تم رفض إثبات الدفع", "error");
      loadPayments();
    });
  });
}

/* ---------------- المحامون ---------------- */
async function loadLawyers() {
  const lawyers = await window.LocalStore.getAll("lawyers");
  document.querySelector("#lawyersTable tbody").innerHTML = lawyers.map((l) => `
    <tr>
      <td>${l.avatarLetter} ${l.name}</td><td>${l.role}</td><td>${l.specialties.join("، ")}</td><td>${l.price} ج.م</td>
      <td>${l.active ? "✅ نشط" : "⛔ متوقف"}</td>
      <td class="row-actions"><button data-edit="${l.id}">تعديل</button><button data-del="${l.id}">حذف</button></td>
    </tr>`).join("");

  document.querySelectorAll("#lawyersTable [data-edit]").forEach((btn) => btn.addEventListener("click", () => lawyerModal(btn.dataset.edit)));
  document.querySelectorAll("#lawyersTable [data-del]").forEach((btn) => btn.addEventListener("click", async () => {
    if (confirm("حذف هذا المحامي؟")) { await window.LocalStore.remove("lawyers", btn.dataset.del); loadLawyers(); }
  }));
}

document.getElementById("addLawyerBtn").addEventListener("click", () => lawyerModal(null));

async function lawyerModal(id) {
  const lawyer = id ? await window.LocalStore.getById("lawyers", id) : { name: "", role: "", specialties: [], price: 300, bio: "", active: true, avatarLetter: "م" };
  openModal(id ? "تعديل بيانات المحامي" : "إضافة محامٍ جديد", `
    <div class="field"><label>الاسم</label><input type="text" id="mName" value="${lawyer.name}"></div>
    <div class="field"><label>المسمى الوظيفي</label><input type="text" id="mRole" value="${lawyer.role}"></div>
    <div class="field"><label>التخصصات (افصل بفاصلة)</label><input type="text" id="mSpecialties" value="${lawyer.specialties.join(", ")}"></div>
    <div class="field-row">
      <div class="field"><label>سعر الاستشارة</label><input type="text" id="mPrice" value="${lawyer.price}"></div>
      <div class="field"><label>الحرف الرمزي (للصورة)</label><input type="text" id="mAvatar" maxlength="1" value="${lawyer.avatarLetter}"></div>
    </div>
    <div class="field"><label>نبذة</label><textarea id="mBio">${lawyer.bio}</textarea></div>
    <div class="field"><label><input type="checkbox" id="mActive" ${lawyer.active ? "checked" : ""} style="width:auto"> نشط ومتاح للحجز</label></div>
    <button class="btn btn-primary btn-block" id="saveLawyerBtn">حفظ</button>
  `);
  document.getElementById("saveLawyerBtn").addEventListener("click", async () => {
    const patch = {
      name: document.getElementById("mName").value, role: document.getElementById("mRole").value,
      specialties: document.getElementById("mSpecialties").value.split(",").map((s) => s.trim()).filter(Boolean),
      price: parseFloat(document.getElementById("mPrice").value) || 0,
      avatarLetter: document.getElementById("mAvatar").value || "م",
      bio: document.getElementById("mBio").value, active: document.getElementById("mActive").checked,
    };
    if (id) await window.LocalStore.update("lawyers", id, patch); else await window.LocalStore.insert("lawyers", patch);
    closeModal(); loadLawyers();
    showToast("تم الحفظ بنجاح", "success");
  });
}

/* ---------------- الأوقات المتاحة ---------------- */
const DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
async function loadAvailability() {
  const lawyers = await window.LocalStore.getAll("lawyers");
  const db = JSON.parse(localStorage.getItem("almizan_db_v1") || "{}");
  const availability = db.availability || {};

  document.getElementById("availabilityList").innerHTML = lawyers.map((l) => {
    const avail = availability[l.id] || { days: [], slots: [] };
    return `
    <div class="panel" style="background:var(--bg-soft)">
      <h4 style="margin-bottom:14px">${l.name}</h4>
      <div class="field">
        <label>أيام العمل</label>
        <div class="filters-bar">
          ${DAY_NAMES.map((d, i) => `<button class="filter-chip ${avail.days.includes(i) ? "active" : ""}" data-day="${i}" data-lawyer="${l.id}">${d}</button>`).join("")}
        </div>
      </div>
      <div class="field">
        <label>الأوقات المتاحة (افصل بفاصلة، مثال: 10:00, 12:00, 14:00)</label>
        <input type="text" class="slots-input" data-lawyer="${l.id}" value="${avail.slots.join(", ")}">
      </div>
      <button class="btn btn-primary btn-sm" data-save-avail="${l.id}">حفظ إتاحة ${l.name.split("/")[1]?.trim() || l.name}</button>
    </div>`;
  }).join("");

  document.querySelectorAll("[data-day]").forEach((btn) => btn.addEventListener("click", () => btn.classList.toggle("active")));

  document.querySelectorAll("[data-save-avail]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const lawyerId = btn.dataset.saveAvail;
      const days = [...document.querySelectorAll(`[data-day][data-lawyer="${lawyerId}"].active`)].map((b) => parseInt(b.dataset.day, 10));
      const slotsInput = document.querySelector(`.slots-input[data-lawyer="${lawyerId}"]`).value;
      const slots = slotsInput.split(",").map((s) => s.trim()).filter(Boolean);

      const dbLatest = JSON.parse(localStorage.getItem("almizan_db_v1") || "{}");
      dbLatest.availability = dbLatest.availability || {};
      dbLatest.availability[lawyerId] = { days, slots };
      localStorage.setItem("almizan_db_v1", JSON.stringify(dbLatest));
      showToast("تم حفظ الأوقات المتاحة", "success");
    });
  });
}

/* ---------------- الخدمات ---------------- */
async function loadServices() {
  const services = await window.LocalStore.getAll("services");
  document.querySelector("#servicesTable tbody").innerHTML = services.map((s) => `
    <tr><td>${s.title}</td><td>${s.specialty}</td><td>${s.basePrice} ج.م</td>
    <td class="row-actions"><button data-edit="${s.id}">تعديل</button><button data-del="${s.id}">حذف</button></td></tr>
  `).join("");
  document.querySelectorAll("#servicesTable [data-edit]").forEach((btn) => btn.addEventListener("click", () => serviceModal(btn.dataset.edit)));
  document.querySelectorAll("#servicesTable [data-del]").forEach((btn) => btn.addEventListener("click", async () => {
    if (confirm("حذف هذه الخدمة؟")) { await window.LocalStore.remove("services", btn.dataset.del); loadServices(); }
  }));
}

document.getElementById("addServiceBtn").addEventListener("click", () => serviceModal(null));

async function serviceModal(id) {
  const svc = id ? await window.LocalStore.getById("services", id) : { title: "", specialty: "", desc: "", basePrice: 300 };
  openModal(id ? "تعديل الخدمة" : "إضافة خدمة", `
    <div class="field"><label>عنوان الخدمة</label><input type="text" id="sTitle" value="${svc.title}"></div>
    <div class="field"><label>التخصص</label><input type="text" id="sSpecialty" value="${svc.specialty}"></div>
    <div class="field"><label>الوصف</label><textarea id="sDesc">${svc.desc}</textarea></div>
    <div class="field"><label>السعر الأساسي</label><input type="text" id="sPrice" value="${svc.basePrice}"></div>
    <button class="btn btn-primary btn-block" id="saveServiceBtn">حفظ</button>
  `);
  document.getElementById("saveServiceBtn").addEventListener("click", async () => {
    const patch = { title: document.getElementById("sTitle").value, specialty: document.getElementById("sSpecialty").value, desc: document.getElementById("sDesc").value, basePrice: parseFloat(document.getElementById("sPrice").value) || 0 };
    if (id) await window.LocalStore.update("services", id, patch); else await window.LocalStore.insert("services", patch);
    closeModal(); loadServices();
    showToast("تم الحفظ بنجاح", "success");
  });
}

/* ---------------- العملاء ---------------- */
async function loadClients() {
  const clients = await window.LocalStore.getAll("clients");
  const seen = new Set();
  const unique = clients.filter((c) => (seen.has(c.email) ? false : seen.add(c.email)));
  document.querySelector("#clientsTable tbody").innerHTML = unique.map((c) => `
    <tr><td>${c.name}</td><td dir="ltr" style="text-align:right">${c.phone}</td><td>${c.email}</td><td>${new Date(c.createdAt).toLocaleDateString("ar-EG")}</td></tr>
  `).join("") || `<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">لا يوجد عملاء بعد</td></tr>`;
}

/* ---------------- المقالات ---------------- */
async function loadArticles() {
  const articles = await window.LocalStore.getAll("articles");
  document.querySelector("#articlesTable tbody").innerHTML = articles.map((a) => `
    <tr><td>${a.title}</td><td>${a.category}</td><td>${a.author}</td><td>${a.date}</td>
    <td class="row-actions"><button data-edit="${a.id}">تعديل</button><button data-del="${a.id}">حذف</button></td></tr>
  `).join("");
  document.querySelectorAll("#articlesTable [data-edit]").forEach((btn) => btn.addEventListener("click", () => articleModal(btn.dataset.edit)));
  document.querySelectorAll("#articlesTable [data-del]").forEach((btn) => btn.addEventListener("click", async () => {
    if (confirm("حذف هذا المقال؟")) { await window.LocalStore.remove("articles", btn.dataset.del); loadArticles(); }
  }));
}

document.getElementById("addArticleBtn").addEventListener("click", () => articleModal(null));

async function articleModal(id) {
  const art = id ? await window.LocalStore.getById("articles", id) : { title: "", category: "", excerpt: "", author: "", date: new Date().toISOString().split("T")[0] };
  openModal(id ? "تعديل المقال" : "مقال جديد", `
    <div class="field"><label>العنوان</label><input type="text" id="aTitle" value="${art.title}"></div>
    <div class="field-row">
      <div class="field"><label>التصنيف</label><input type="text" id="aCategory" value="${art.category}"></div>
      <div class="field"><label>التاريخ</label><input type="date" id="aDate" value="${art.date}"></div>
    </div>
    <div class="field"><label>الكاتب</label><input type="text" id="aAuthor" value="${art.author}"></div>
    <div class="field"><label>مقتطف/ملخص</label><textarea id="aExcerpt">${art.excerpt}</textarea></div>
    <button class="btn btn-primary btn-block" id="saveArticleBtn">حفظ</button>
  `);
  document.getElementById("saveArticleBtn").addEventListener("click", async () => {
    const patch = { title: document.getElementById("aTitle").value, category: document.getElementById("aCategory").value, date: document.getElementById("aDate").value, author: document.getElementById("aAuthor").value, excerpt: document.getElementById("aExcerpt").value };
    if (id) await window.LocalStore.update("articles", id, patch); else await window.LocalStore.insert("articles", patch);
    closeModal(); loadArticles();
    showToast("تم الحفظ بنجاح", "success");
  });
}

/* ---------------- الملفات ---------------- */
async function loadFiles() {
  const [files, bookings] = await Promise.all([window.LocalStore.getAll("files"), window.LocalStore.getAll("bookings")]);
  document.querySelector("#filesTable tbody").innerHTML = files.map((f) => {
    const b = bookings.find((x) => x.id === f.bookingId);
    return `<tr><td>${f.name}</td><td>${b ? b.clientName : "—"}</td><td>${f.type || "—"}</td><td>${(f.size / 1024).toFixed(0)} ك.ب</td>
    <td class="row-actions"><a href="${f.base64}" download="${f.name}" class="btn btn-ghost btn-sm">تنزيل</a><button data-del="${f.id}">حذف</button></td></tr>`;
  }).join("") || `<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">لا توجد ملفات مرفوعة بعد</td></tr>`;

  document.querySelectorAll("#filesTable [data-del]").forEach((btn) => btn.addEventListener("click", async () => {
    if (confirm("حذف هذا الملف؟")) { await window.LocalStore.remove("files", btn.dataset.del); loadFiles(); }
  }));
}

/* ---------------- التقييمات ---------------- */
async function loadRatings() {
  const [ratings, bookings] = await Promise.all([window.LocalStore.getAll("ratings"), window.LocalStore.getAll("bookings")]);
  document.querySelector("#ratingsTable tbody").innerHTML = ratings.map((r) => {
    const b = bookings.find((x) => x.id === r.bookingId);
    return `<tr><td>${b ? b.clientName + " — " + b.specialty : "—"}</td><td>${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}</td><td>${r.comment || "—"}</td><td>${new Date(r.createdAt).toLocaleDateString("ar-EG")}</td></tr>`;
  }).join("") || `<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">لا توجد تقييمات بعد</td></tr>`;
}

/* ---------------- التهيئة ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  initAdminTheme();
  initTabs();
  loadOverview();
});

/* toast محلي بسيط لصفحات لوحة التحكم (نفس تصميم main.js) */
function showToast(message, type = "") {
  let toast = document.querySelector(".toast");
  if (!toast) { toast = document.createElement("div"); toast.className = "toast"; document.body.appendChild(toast); }
  toast.className = `toast ${type}`;
  toast.textContent = message;
  requestAnimationFrame(() => toast.classList.add("show"));
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove("show"), 3200);
}
