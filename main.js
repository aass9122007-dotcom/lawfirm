/**
 * =============================================================
 *  main.js — السلوك المشترك بين كل صفحات الموقع
 * =============================================================
 */

const SITE = {
  pages: [
    { href: "index.html", label: "الرئيسية" },
    { href: "about.html", label: "من نحن" },
    { href: "services.html", label: "خدماتنا" },
    { href: "team.html", label: "فريق العمل" },
    { href: "articles.html", label: "المقالات القانونية" },
    { href: "faq.html", label: "الأسئلة الشائعة" },
    { href: "contact.html", label: "تواصل معنا" },
  ],
};

function currentPage() {
  const path = location.pathname.split("/").pop() || "index.html";
  return path;
}

function svgIcon(name) {
  const icons = {
    sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
    moon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.7 15.6A9 9 0 1 1 8.4 3.3a7 7 0 0 0 12.3 12.3Z"/></svg>`,
    whatsapp: `<svg viewBox="0 0 32 32" fill="currentColor"><path d="M16.02 3C9.4 3 4 8.4 4 15.02c0 2.4.63 4.6 1.85 6.6L4 29l7.55-1.98a12 12 0 0 0 4.47.86h.01c6.62 0 12.02-5.4 12.02-12.02C28.05 8.4 22.65 3 16.02 3zm7.03 17.2c-.3.83-1.72 1.6-2.37 1.7-.6.1-1.36.14-2.2-.14-.5-.16-1.15-.37-1.98-.73-3.48-1.5-5.75-5.02-5.92-5.25-.17-.24-1.4-1.87-1.4-3.57 0-1.7.9-2.53 1.22-2.87.32-.34.7-.43.94-.43.23 0 .47 0 .67.01.22.01.5-.08.78.6.3.7 1 2.42 1.09 2.6.09.17.15.38.03.6-.12.24-.18.38-.36.6-.18.2-.38.46-.54.62-.18.18-.37.37-.16.72.2.35.9 1.5 1.95 2.44 1.34 1.2 2.47 1.57 2.83 1.75.36.18.57.15.78-.09.21-.24.9-1.04 1.14-1.4.24-.35.48-.3.8-.18.32.12 2.05.97 2.4 1.15.36.18.6.27.68.42.09.16.09.86-.2 1.7z"/></svg>`,
    phone: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.2 1L6.6 10.8z"/></svg>`,
    mail: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>`,
    menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`,
  };
  return icons[name] || "";
}

function brandMarkSVG() {
  return `<svg class="brand-mark" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="30" cy="30" r="29" stroke="#C9A24B" stroke-width="1.5"/>
    <path d="M30 12v28M18 20h24M18 20l-5 12a5 5 0 0 0 10 0l-5-12zM42 20l-5 12a5 5 0 0 0 10 0l-5-12z" stroke="#C9A24B" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="24" y="42" width="12" height="3" rx="1.5" fill="#C9A24B"/>
  </svg>`;
}

function renderHeader() {
  const cur = currentPage();
  const links = SITE.pages
    .map((p) => `<a href="${p.href}" class="${p.href === cur ? "active" : ""}">${p.label}</a>`)
    .join("");

  const mobileLinks = SITE.pages
    .map((p) => `<a href="${p.href}" class="${p.href === cur ? "active" : ""}">${p.label}</a>`)
    .join("") + `<a href="booking.html" class="active" style="color:var(--brass-light)">حجز استشارة ←</a>`;

  const header = document.createElement("header");
  header.innerHTML = `
    <nav class="navbar" id="navbar">
      <div class="container nav-inner">
        <a href="index.html" class="brand">
          ${brandMarkSVG()}
          <span>الميزان للمحاماة<small>ALMIZAN LAW OFFICE</small></span>
        </a>
        <div class="nav-links">${links}</div>
        <div class="nav-actions">
          <button class="icon-btn" id="themeToggle" aria-label="تبديل الوضع الليلي">${svgIcon("moon")}</button>
          <a href="booking.html" class="btn btn-gold btn-sm">احجز استشارة</a>
          <button class="burger" id="burgerBtn" aria-label="القائمة">${svgIcon("menu")}</button>
        </div>
      </div>
    </nav>
    <div class="mobile-menu" id="mobileMenu">${mobileLinks}</div>
  `;
  document.body.prepend(header);
}

function renderFooter() {
  const cfg = window.APP_CONFIG?.office || {};
  const footer = document.createElement("footer");
  footer.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div>
          <h4>الميزان للمحاماة</h4>
          <p style="max-width:280px">${cfg.name || ""} — نقدّم استشارات واستراتيجيات قانونية دقيقة تحفظ حقوقك وتصون مصالحك.</p>
          <div class="social-row">
            <a href="#" aria-label="فيسبوك">f</a>
            <a href="#" aria-label="لينكدإن">in</a>
            <a href="#" aria-label="إكس">X</a>
          </div>
        </div>
        <div>
          <h4>روابط سريعة</h4>
          <ul>
            <li><a href="about.html">من نحن</a></li>
            <li><a href="services.html">خدماتنا</a></li>
            <li><a href="team.html">فريق العمل</a></li>
            <li><a href="articles.html">المقالات القانونية</a></li>
          </ul>
        </div>
        <div>
          <h4>خدمات العملاء</h4>
          <ul>
            <li><a href="booking.html">حجز استشارة</a></li>
            <li><a href="faq.html">الأسئلة الشائعة</a></li>
            <li><a href="contact.html">تواصل معنا</a></li>
            <li><a href="admin/index.html">لوحة التحكم</a></li>
          </ul>
        </div>
        <div>
          <h4>تواصل معنا</h4>
          <ul>
            <li>${cfg.address || ""}</li>
            <li dir="ltr" style="text-align:right">${cfg.phone || ""}</li>
            <li>${cfg.email || ""}</li>
            <li>${cfg.workHours || ""}</li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© <span id="year"></span> جميع الحقوق محفوظة — مكتب الميزان للمحاماة والاستشارات القانونية</span>
        <span>تصميم وتطوير بعناية قانونية ورقمية</span>
      </div>
    </div>
  `;
  document.body.appendChild(footer);
  document.getElementById("year").textContent = new Date().getFullYear();
}

function renderQuickContact() {
  const cfg = window.APP_CONFIG?.office || {};
  const wrap = document.createElement("div");
  wrap.className = "quick-contact";
  wrap.innerHTML = `
    <a class="quick-btn whatsapp" target="_blank" rel="noopener"
       href="https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent("مرحبًا، أرغب في الاستفسار عن خدمات المكتب")}"
       aria-label="تواصل عبر واتساب">${svgIcon("whatsapp")}</a>
    <a class="quick-btn phone" href="tel:${cfg.phone}" aria-label="اتصال هاتفي">${svgIcon("phone")}</a>
    <a class="quick-btn email" href="mailto:${cfg.email}" aria-label="مراسلة بالبريد">${svgIcon("mail")}</a>
  `;
  document.body.appendChild(wrap);
}

function initTheme() {
  const saved = localStorage.getItem("almizan_theme");
  const theme = saved || "light";
  document.documentElement.setAttribute("data-theme", theme);
  updateThemeIcon(theme);

  document.getElementById("themeToggle").addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("almizan_theme", next);
    updateThemeIcon(next);
  });
}

function updateThemeIcon(theme) {
  const btn = document.getElementById("themeToggle");
  if (btn) btn.innerHTML = theme === "dark" ? svgIcon("sun") : svgIcon("moon");
}

function initNav() {
  const navbar = document.getElementById("navbar");
  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 20);
  });

  const burger = document.getElementById("burgerBtn");
  const menu = document.getElementById("mobileMenu");
  burger.addEventListener("click", () => menu.classList.toggle("open"));
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => menu.classList.remove("open")));
}

function initReveal() {
  const els = document.querySelectorAll(".reveal");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  els.forEach((el) => io.observe(el));
}

function showToast(message, type = "") {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.className = `toast ${type}`;
  toast.textContent = message;
  requestAnimationFrame(() => toast.classList.add("show"));
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove("show"), 3200);
}
window.showToast = showToast;

document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderFooter();
  renderQuickContact();
  initTheme();
  initNav();
  initReveal();
  if (window.ChatbotWidget) window.ChatbotWidget.init();
});
