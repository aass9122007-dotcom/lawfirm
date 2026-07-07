/**
 * =============================================================
 *  booking.js — منطق معالج حجز الاستشارات
 * =============================================================
 * يبني الحجز كائنًا واحدًا (bookingDraft)، يحفظه في LocalStore
 * (بديل مؤقت لـ Supabase)، ثم يرسله إلى n8n عبر Webhook مع أي
 * ملفات مرفقة بصيغة base64. بعد تأكيد الدفع يُرسل إثبات الدفع
 * في Webhook مستقل، ويحدَّث حالة الحجز إلى "قيد المراجعة".
 * =============================================================
 */

const bookingDraft = {
  type: null,
  specialty: null,
  lawyerId: null,
  lawyerName: null,
  date: null,
  time: null,
  clientName: "",
  clientPhone: "",
  clientEmail: "",
  notes: "",
  files: [], // {name, size, base64}
  price: 0,
};

let currentStep = 1;
let uploadedFiles = [];
let receiptFile = null;
let servicesCache = [];
let lawyersCache = [];

function goToStep(step) {
  document.querySelectorAll(".wizard-step").forEach((el) => {
    const s = parseInt(el.dataset.step, 10);
    el.classList.toggle("active", s === step);
    el.classList.toggle("done", s < step);
  });
  document.querySelectorAll(".wizard-panel").forEach((el) => {
    el.classList.toggle("active", parseInt(el.dataset.panel, 10) === step);
  });
  currentStep = step;
  window.scrollTo({ top: document.querySelector(".page-header").offsetHeight, behavior: "smooth" });
}

/* ---------------- الخطوة 1: نوع الاستشارة ---------------- */
function initStep1() {
  const choices = document.querySelectorAll('[data-panel="1"] .choice');
  choices.forEach((c) => {
    c.addEventListener("click", () => {
      choices.forEach((x) => x.classList.remove("selected"));
      c.classList.add("selected");
      bookingDraft.type = c.dataset.value;
      document.getElementById("toStep2").disabled = false;
    });
  });
  document.getElementById("toStep2").addEventListener("click", () => goToStep(2));
}

/* ---------------- الخطوة 2: التخصص والمحامي ---------------- */
async function initStep2() {
  servicesCache = await window.LocalStore.getAll("services");
  lawyersCache = (await window.LocalStore.getAll("lawyers")).filter((l) => l.active);

  const sel = document.getElementById("specialtySelect");
  sel.innerHTML = servicesCache.map((s) => `<option value="${s.specialty}" data-price="${s.basePrice}">${s.title}</option>`).join("");

  const params = new URLSearchParams(location.search);
  const preSpecialty = params.get("specialty");
  if (preSpecialty && [...sel.options].some((o) => o.value === preSpecialty)) {
    sel.value = preSpecialty;
  }

  bookingDraft.specialty = sel.value;
  renderLawyerChoices(sel.value);

  sel.addEventListener("change", () => {
    bookingDraft.specialty = sel.value;
    bookingDraft.lawyerId = null;
    document.getElementById("toStep3").disabled = true;
    renderLawyerChoices(sel.value);
  });

  const preLawyer = params.get("lawyer");
  if (preLawyer) {
    setTimeout(() => {
      const el = document.querySelector(`.choice[data-lawyer="${preLawyer}"]`);
      if (el) el.click();
    }, 50);
  }

  document.getElementById("toStep3").addEventListener("click", () => {
    prepareTimeStep();
    goToStep(3);
  });
}

function renderLawyerChoices(specialty) {
  const wrap = document.getElementById("lawyerChoices");
  const matched = lawyersCache.filter((l) => l.specialties.includes(specialty));
  const list = matched.length ? matched : lawyersCache;
  wrap.innerHTML = list
    .map(
      (l) => `
    <div class="choice" data-lawyer="${l.id}">
      <div class="ic">⚖️</div>
      <h4>${l.name}</h4>
      <p>${l.role} — ${l.price} ج.م</p>
    </div>`
    )
    .join("");

  wrap.querySelectorAll(".choice").forEach((c) => {
    c.addEventListener("click", () => {
      wrap.querySelectorAll(".choice").forEach((x) => x.classList.remove("selected"));
      c.classList.add("selected");
      const lawyer = list.find((l) => l.id === c.dataset.lawyer);
      bookingDraft.lawyerId = lawyer.id;
      bookingDraft.lawyerName = lawyer.name;
      bookingDraft.price = lawyer.price;
      document.getElementById("toStep3").disabled = false;
    });
  });
}

/* ---------------- الخطوة 3: التاريخ والوقت ---------------- */
let step3Initialized = false;
function prepareTimeStep() {
  const dateInput = document.getElementById("dateInput");
  const today = new Date();
  today.setDate(today.getDate() + 1);
  dateInput.min = today.toISOString().split("T")[0];
  if (!dateInput.value) dateInput.value = today.toISOString().split("T")[0];
  renderSlotsForDate();

  if (!step3Initialized) {
    dateInput.addEventListener("change", renderSlotsForDate);
    document.getElementById("toStep4").addEventListener("click", () => goToStep(4));
    step3Initialized = true;
  }
}

async function renderSlotsForDate() {
  const dateInput = document.getElementById("dateInput");
  const availability = JSON.parse(localStorage.getItem("almizan_db_v1") || "{}").availability || {};
  const avail = availability[bookingDraft.lawyerId] || { days: [0, 1, 2, 3, 4], slots: ["10:00", "12:00", "14:00"] };

  const selectedDate = new Date(dateInput.value);
  const dayOfWeek = selectedDate.getDay(); // 0=أحد
  const wrap = document.getElementById("timeSlots");

  if (!avail.days.includes(dayOfWeek)) {
    wrap.innerHTML = `<p style="grid-column:1/-1;color:var(--danger)">المحامي غير متاح في هذا اليوم، الرجاء اختيار يوم آخر.</p>`;
    document.getElementById("toStep4").disabled = true;
    return;
  }

  // استبعاد الأوقات المحجوزة مسبقًا لنفس المحامي في نفس اليوم
  const bookings = await window.LocalStore.getAll("bookings");
  const bookedSlots = bookings
    .filter((b) => b.lawyerId === bookingDraft.lawyerId && b.date === dateInput.value && b.status !== "ملغي")
    .map((b) => b.time);

  wrap.innerHTML = avail.slots
    .map((t) => {
      const taken = bookedSlots.includes(t);
      return `<div class="choice ${taken ? "disabled" : ""}" data-time="${t}" style="${taken ? "opacity:.4;pointer-events:none" : ""}">
        <div class="ic">🕐</div><h4>${t}</h4><p>${taken ? "محجوز" : "متاح"}</p>
      </div>`;
    })
    .join("");

  wrap.querySelectorAll(".choice").forEach((c) => {
    c.addEventListener("click", () => {
      wrap.querySelectorAll(".choice").forEach((x) => x.classList.remove("selected"));
      c.classList.add("selected");
      bookingDraft.date = dateInput.value;
      bookingDraft.time = c.dataset.time;
      document.getElementById("toStep4").disabled = false;
    });
  });
}

/* ---------------- الخطوة 4: بيانات العميل والملفات ---------------- */
function initStep4() {
  const uploadBox = document.getElementById("uploadBox");
  const fileInput = document.getElementById("fileInput");
  const fileList = document.getElementById("fileList");

  uploadBox.addEventListener("click", () => fileInput.click());
  uploadBox.addEventListener("dragover", (e) => { e.preventDefault(); uploadBox.classList.add("drag"); });
  uploadBox.addEventListener("dragleave", () => uploadBox.classList.remove("drag"));
  uploadBox.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadBox.classList.remove("drag");
    handleFiles(e.dataTransfer.files);
  });
  fileInput.addEventListener("change", () => handleFiles(fileInput.files));

  function handleFiles(files) {
    [...files].forEach((f) => {
      if (f.size > 8 * 1024 * 1024) {
        showToast("حجم الملف يتجاوز 8 ميجابايت: " + f.name, "error");
        return;
      }
      uploadedFiles.push(f);
    });
    renderFileList();
  }

  function renderFileList() {
    fileList.innerHTML = uploadedFiles
      .map(
        (f, i) => `<div class="file-chip"><span>📄 ${f.name} (${(f.size / 1024).toFixed(0)} كيلوبايت)</span><button data-i="${i}">✕</button></div>`
      )
      .join("");
    fileList.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        uploadedFiles.splice(parseInt(btn.dataset.i, 10), 1);
        renderFileList();
      });
    });
  }

  const requiredInputs = ["clientName", "clientPhone", "clientEmail"];
  requiredInputs.forEach((id) => {
    document.getElementById(id).addEventListener("input", validateStep4);
  });

  function validateStep4() {
    const ok = requiredInputs.every((id) => document.getElementById(id).value.trim().length > 1);
    document.getElementById("toStep5").disabled = !ok;
  }

  document.getElementById("toStep5").addEventListener("click", () => {
    bookingDraft.clientName = document.getElementById("clientName").value.trim();
    bookingDraft.clientPhone = document.getElementById("clientPhone").value.trim();
    bookingDraft.clientEmail = document.getElementById("clientEmail").value.trim();
    bookingDraft.notes = document.getElementById("clientNotes").value.trim();
    renderSummary();
    goToStep(5);
  });
}

/* ---------------- الخطوة 5: المراجعة + الدفع + التأكيد ---------------- */
function renderSummary() {
  const service = servicesCache.find((s) => s.specialty === bookingDraft.specialty);
  const rows = [
    ["نوع الاستشارة", bookingDraft.type],
    ["التخصص", service ? service.title : bookingDraft.specialty],
    ["المحامي", bookingDraft.lawyerName],
    ["التاريخ", bookingDraft.date],
    ["الوقت", bookingDraft.time],
    ["الاسم", bookingDraft.clientName],
    ["الهاتف", bookingDraft.clientPhone],
    ["البريد الإلكتروني", bookingDraft.clientEmail],
    ["عدد الملفات المرفقة", uploadedFiles.length],
    ["السعر التقديري", bookingDraft.price + " ج.م"],
  ];
  document.getElementById("summaryBox").innerHTML = rows
    .map(([k, v]) => `<div class="summary-row"><span>${k}</span><b>${v || "—"}</b></div>`)
    .join("");
}

async function confirmBooking() {
  const btn = document.getElementById("confirmBookingBtn");
  btn.disabled = true;
  btn.textContent = "جارِ إنشاء الحجز...";

  const filesBase64 = await Promise.all(
    uploadedFiles.map(async (f) => ({ name: f.name, type: f.type, size: f.size, base64: await fileToBase64(f) }))
  );

  const record = await window.LocalStore.insert("bookings", {
    type: bookingDraft.type,
    specialty: bookingDraft.specialty,
    lawyerId: bookingDraft.lawyerId,
    lawyerName: bookingDraft.lawyerName,
    date: bookingDraft.date,
    time: bookingDraft.time,
    clientName: bookingDraft.clientName,
    clientPhone: bookingDraft.clientPhone,
    clientEmail: bookingDraft.clientEmail,
    notes: bookingDraft.notes,
    price: bookingDraft.price,
    status: "بانتظار الدفع",
    fileCount: filesBase64.length,
  });

  // حفظ الملفات في جدول files منفصل
  for (const f of filesBase64) {
    await window.LocalStore.insert("files", { bookingId: record.id, name: f.name, type: f.type, size: f.size, base64: f.base64, kind: "مستند إرفاق" });
  }

  // حفظ/تحديث بيانات العميل
  await window.LocalStore.insert("clients", {
    name: bookingDraft.clientName,
    phone: bookingDraft.clientPhone,
    email: bookingDraft.clientEmail,
    lastBookingId: record.id,
  });

  // إرسال البيانات إلى n8n Webhook (سيتولى n8n المراجعة وإشعار المسؤول)
  try {
    await fetch(window.APP_CONFIG.n8n.bookingWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking: record, files: filesBase64 }),
      mode: "no-cors",
    });
  } catch (err) {
    console.warn("سيتم تفعيل الإرسال الفعلي بعد ربط n8n بالرابط الصحيح:", err);
  }

  bookingDraft.recordId = record.id;

  // عرض بيانات الدفع
  const pay = window.APP_CONFIG.payment;
  document.getElementById("bookingRefNum").textContent = "#" + record.id.slice(-6).toUpperCase();
  document.getElementById("payBank").textContent = pay.bankName;
  document.getElementById("payAccName").textContent = pay.accountName;
  document.getElementById("payIban").textContent = pay.iban;
  document.getElementById("payVfCash").textContent = pay.vodafoneCash;
  document.getElementById("payInstapay").textContent = pay.instapay;
  document.getElementById("payAmount").textContent = bookingDraft.price + " ج.م";

  [document.getElementById("payIban"), document.getElementById("payVfCash"), document.getElementById("payInstapay")].forEach((el) => {
    el.addEventListener("click", () => {
      navigator.clipboard?.writeText(el.textContent);
      showToast("تم النسخ ✓", "success");
    });
  });

  document.getElementById("reviewSection").style.display = "none";
  document.getElementById("paymentSection").style.display = "block";
}

function initPaymentUpload() {
  const box = document.getElementById("receiptBox");
  const input = document.getElementById("receiptInput");
  const list = document.getElementById("receiptList");
  const submitBtn = document.getElementById("submitPaymentBtn");

  box.addEventListener("click", () => input.click());
  input.addEventListener("change", () => {
    if (input.files[0]) {
      receiptFile = input.files[0];
      list.innerHTML = `<div class="file-chip"><span>🧾 ${receiptFile.name}</span><button id="removeReceipt">✕</button></div>`;
      submitBtn.disabled = false;
      document.getElementById("removeReceipt").addEventListener("click", () => {
        receiptFile = null;
        list.innerHTML = "";
        submitBtn.disabled = true;
      });
    }
  });

  submitBtn.addEventListener("click", async () => {
    submitBtn.disabled = true;
    submitBtn.textContent = "جارِ الإرسال...";

    const base64 = await fileToBase64(receiptFile);
    const paymentRecord = await window.LocalStore.insert("payments", {
      bookingId: bookingDraft.recordId,
      amount: bookingDraft.price,
      receiptName: receiptFile.name,
      receiptBase64: base64,
      status: "قيد المراجعة",
    });

    await window.LocalStore.update("bookings", bookingDraft.recordId, { status: "قيد المراجعة" });

    try {
      await fetch(window.APP_CONFIG.n8n.paymentWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: bookingDraft.recordId,
          payment: { ...paymentRecord, receiptBase64: undefined },
          receiptBase64: base64,
        }),
        mode: "no-cors",
      });
    } catch (err) {
      console.warn("سيتم تفعيل الإرسال الفعلي بعد ربط n8n:", err);
    }

    document.getElementById("paymentSection").style.display = "none";
    document.getElementById("confirmSection").style.display = "block";
    document.getElementById("finalSummaryBox").innerHTML = document.getElementById("summaryBox").innerHTML;
    goToStep(5);
    showToast("تم استلام إثبات الدفع، سيتم تأكيد حجزك تلقائيًا بعد المراجعة.", "success");
  });
}

/* ---------------- تهيئة عامة ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  initStep1();
  initStep2();
  initStep4();
  initPaymentUpload();

  document.getElementById("confirmBookingBtn").addEventListener("click", confirmBooking);

  document.querySelectorAll("[data-back]").forEach((btn) => {
    btn.addEventListener("click", () => goToStep(parseInt(btn.dataset.back, 10)));
  });
});
