/**
 * =============================================================
 *  chatbot.js — بوت الأسئلة الشائعة
 * =============================================================
 * بوت قائم على قواعد ومطابقة كلمات مفتاحية من بيانات الأسئلة
 * الشائعة (js/data.js). جاهز لاحقًا لاستبدال دالة getBotReply
 * باستدعاء Webhook n8n يوصّل إلى نموذج ذكاء اصطناعي حقيقي.
 * =============================================================
 */

window.ChatbotWidget = (function () {
  let opened = false;

  function keywordsMatch(text, faq) {
    const norm = (s) => s.replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").toLowerCase();
    const t = norm(text);
    const q = norm(faq.q);
    const words = q.split(/\s+/).filter((w) => w.length > 2);
    let score = 0;
    words.forEach((w) => { if (t.includes(w)) score++; });
    return score;
  }

  async function getBotReply(text) {
    const faqs = await window.LocalStore.getAll("faqs");
    let best = null;
    let bestScore = 0;
    faqs.forEach((f) => {
      const s = keywordsMatch(text, f);
      if (s > bestScore) { bestScore = s; best = f; }
    });

    if (best && bestScore >= 1) {
      return best.a;
    }

    if (/حجز|موعد|استشاره/.test(text.replace(/[أإآ]/g,"ا"))) {
      return "يمكنك حجز استشارتك مباشرة من صفحة «حجز استشارة» أعلى الموقع، خلال دقائق معدودة.";
    }
    if (/سعر|تكلفه|فلوس|رسوم/.test(text.replace(/[أإآ]/g,"ا").replace(/ة/g,"ه"))) {
      return "تختلف الرسوم حسب نوع الاستشارة والمحامي، ويمكنك تجربة حاسبة الرسوم التقديرية في صفحة الأسئلة الشائعة أو صفحة الحجز.";
    }
    return "شكرًا لتواصلك! لم أجد إجابة دقيقة لسؤالك ضمن الأسئلة الشائعة، يمكنك تصفح صفحة «الأسئلة الشائعة» بالكامل أو التواصل مباشرة عبر واتساب وسيتم الرد عليك من فريقنا القانوني.";
  }

  function bubble(text, who) {
    const div = document.createElement("div");
    div.className = `msg ${who}`;
    div.textContent = text;
    return div;
  }

  async function send(body, text) {
    if (!text.trim()) return;
    body.appendChild(bubble(text, "user"));
    body.scrollTop = body.scrollHeight;
    const typing = bubble("يكتب الآن...", "bot");
    typing.style.opacity = ".6";
    body.appendChild(typing);
    body.scrollTop = body.scrollHeight;

    const reply = await getBotReply(text);
    setTimeout(() => {
      typing.remove();
      body.appendChild(bubble(reply, "bot"));
      body.scrollTop = body.scrollHeight;
    }, 500);
  }

  function init() {
    const fab = document.createElement("button");
    fab.className = "chatbot-fab";
    fab.setAttribute("aria-label", "مساعد الأسئلة الشائعة");
    fab.innerHTML = "💬";

    const win = document.createElement("div");
    win.className = "chatbot-window";
    win.innerHTML = `
      <div class="chatbot-head">
        <div class="thumb-sm" style="background:var(--brass);color:var(--ink)">⚖</div>
        <div>
          <div style="font-weight:700">مساعد الميزان الذكي</div>
          <div style="font-size:.72rem;display:flex;align-items:center;gap:6px;color:#9FAAB9"><span class="dotpulse"></span> متصل الآن</div>
        </div>
      </div>
      <div class="chatbot-body" id="cbBody"></div>
      <div class="chatbot-suggestions" id="cbChips"></div>
      <div class="chatbot-input">
        <input type="text" id="cbInput" placeholder="اكتب سؤالك هنا...">
        <button id="cbSend" aria-label="إرسال">➤</button>
      </div>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(win);

    const body = win.querySelector("#cbBody");
    const chips = win.querySelector("#cbChips");
    const input = win.querySelector("#cbInput");
    const sendBtn = win.querySelector("#cbSend");

    body.appendChild(bubble("مرحبًا بك في مكتب الميزان للمحاماة 👋 أنا مساعدك الذكي، اسألني عن الحجز أو الأسعار أو أي استفسار قانوني عام.", "bot"));

    window.LocalStore.getAll("faqs").then((faqs) => {
      faqs.slice(0, 3).forEach((f) => {
        const c = document.createElement("button");
        c.className = "chip-btn";
        c.textContent = f.q;
        c.addEventListener("click", () => send(body, f.q));
        chips.appendChild(c);
      });
    });

    fab.addEventListener("click", () => {
      opened = !opened;
      win.classList.toggle("open", opened);
    });

    sendBtn.addEventListener("click", () => {
      send(body, input.value);
      input.value = "";
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        send(body, input.value);
        input.value = "";
      }
    });
  }

  return { init };
})();
