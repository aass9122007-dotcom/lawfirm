/**
 * =============================================================
 *  طبقة البيانات — LocalStore
 * =============================================================
 * تحاكي هذه الطبقة قاعدة بيانات حقيقية باستخدام localStorage
 * ريثما يتم الربط مع Supabase. كل الدوال async حتى يسهل استبدال
 * محتواها باستدعاءات supabase-js دون تعديل أي كود يستخدمها.
 * =============================================================
 */

const DB_KEY = "almizan_db_v1";

const SEED = {
  lawyers: [
    { id: "law-1", name: "المستشار / أحمد الوزير", role: "الشريك المؤسس", specialties: ["تجاري", "شركات"], bio: "خبرة 22 عامًا في القانون التجاري وتأسيس الشركات وصياغة العقود.", price: 500, active: true, avatarLetter: "أ" },
    { id: "law-2", name: "الأستاذة / سلمى عبد الحميد", role: "محامية أحوال شخصية", specialties: ["أحوال شخصية", "أسرة"], bio: "متخصصة في قضايا الأسرة والطلاق والحضانة والنفقة.", price: 350, active: true, avatarLetter: "س" },
    { id: "law-3", name: "المستشار / كريم فتحي", role: "محامي جنائي", specialties: ["جنائي"], bio: "خبير في القضايا الجنائية والدفاع الجنائي أمام محاكم الجنايات.", price: 450, active: true, avatarLetter: "ك" },
    { id: "law-4", name: "الأستاذة / منى الشريف", role: "محامية عقارية وإدارية", specialties: ["عقاري", "إداري"], bio: "متخصصة في المنازعات العقارية والطعون الإدارية والتراخيص.", price: 400, active: true, avatarLetter: "م" },
    { id: "law-5", name: "المستشار / يوسف العدل", role: "محامي عمالي", specialties: ["عمالي"], bio: "خبرة واسعة في قضايا العمل وفصل العمال والتأمينات.", price: 300, active: true, avatarLetter: "ي" },
  ],

  services: [
    { id: "svc-1", title: "قانون الشركات والاستثمار", specialty: "تجاري", desc: "تأسيس الشركات، صياغة عقود التأسيس، الحوكمة، والاندماج والاستحواذ.", basePrice: 500, icon: "briefcase" },
    { id: "svc-2", title: "الأحوال الشخصية والأسرة", specialty: "أحوال شخصية", desc: "الطلاق، الخلع، الحضانة، النفقة، والميراث بمنتهى السرية والاحترافية.", basePrice: 350, icon: "family" },
    { id: "svc-3", title: "القضايا الجنائية", specialty: "جنائي", desc: "الدفاع الجنائي، الحبس الاحتياطي، الطعون، والتصالح الجنائي.", basePrice: 450, icon: "shield" },
    { id: "svc-4", title: "المنازعات العقارية", specialty: "عقاري", desc: "عقود البيع والإيجار، فسخ العقود، وقضايا الملكية والتقسيم.", basePrice: 400, icon: "building" },
    { id: "svc-5", title: "قانون العمل والعمال", specialty: "عمالي", desc: "فصل تعسفي، مستحقات نهاية الخدمة، ولوائح العمل الداخلية.", basePrice: 300, icon: "work" },
    { id: "svc-6", title: "التقاضي الإداري", specialty: "إداري", desc: "الطعون على القرارات الإدارية، المناقصات، والتراخيص الحكومية.", basePrice: 400, icon: "scale" },
  ],

  articles: [
    { id: "art-1", title: "دليلك الكامل لإجراءات تأسيس شركة في مصر 2026", category: "تجاري", excerpt: "خطوات عملية ومستندات مطلوبة لتأسيس شركتك بسرعة وأمان قانوني.", date: "2026-05-12", author: "المستشار أحمد الوزير" },
    { id: "art-2", title: "الفرق بين الخلع والطلاق للضرر: أيهما يناسب حالتك؟", category: "أحوال شخصية", excerpt: "مقارنة قانونية مبسطة بين المسارين وآثار كل منهما على الحقوق.", date: "2026-04-02", author: "الأستاذة سلمى عبد الحميد" },
    { id: "art-3", title: "حقوقك عند القبض عليك: ما يجب معرفته فورًا", category: "جنائي", excerpt: "خطوات عملية لحماية حقوقك القانونية من اللحظة الأولى للقبض.", date: "2026-03-20", author: "المستشار كريم فتحي" },
    { id: "art-4", title: "كيف تحمي عقدك الإيجاري من الفسخ التعسفي؟", category: "عقاري", excerpt: "بنود أساسية يجب تضمينها في عقد الإيجار لحماية حقوق الطرفين.", date: "2026-02-14", author: "الأستاذة منى الشريف" },
    { id: "art-5", title: "مستحقاتك عند إنهاء الخدمة: دليل مبسط للعامل", category: "عمالي", excerpt: "كل ما تحتاج معرفته عن المكافأة وبدل الإجازات والإخطار.", date: "2026-01-28", author: "المستشار يوسف العدل" },
    { id: "art-6", title: "الطعن على القرارات الإدارية: متى وكيف؟", category: "إداري", excerpt: "المواعيد القانونية والإجراءات الصحيحة للطعن أمام القضاء الإداري.", date: "2025-12-10", author: "المستشار أحمد الوزير" },
  ],

  faqs: [
    { id: "faq-1", q: "كيف يمكنني حجز استشارة قانونية؟", a: "يمكنك حجز استشارتك مباشرة من صفحة «حجز استشارة»، باختيار نوع الاستشارة والتخصص والمحامي والموعد المناسب، ثم إتمام الدفع وتأكيد الحجز.", cat: "الحجز" },
    { id: "faq-2", q: "ما هي طرق الدفع المتاحة؟", a: "نوفر الدفع عبر التحويل البنكي، فودافون كاش، وInstaPay. بعد الحجز ستظهر لك بيانات الدفع كاملة، وتقوم برفع صورة الإيصال لتأكيد الحجز.", cat: "الدفع" },
    { id: "faq-3", q: "هل يمكن إجراء الاستشارة أونلاين؟", a: "نعم، نوفر استشارات حضورية في المكتب، وأونلاين عبر مكالمة فيديو، وهاتفية أيضًا، حسب اختيارك عند الحجز.", cat: "الاستشارات" },
    { id: "faq-4", q: "كم تستغرق مدة تأكيد الحجز بعد الدفع؟", a: "غالبًا يتم تأكيد الحجز خلال ساعة من رفع إيصال الدفع خلال أوقات العمل الرسمية، وستصلك رسالة تأكيد فور المراجعة.", cat: "الحجز" },
    { id: "faq-5", q: "هل بياناتي ومستنداتي سرية؟", a: "نعم، جميع البيانات والمستندات التي ترفعها تعامل بسرية تامة ولا يطّلع عليها إلا المحامي المختص بقضيتك.", cat: "الخصوصية" },
    { id: "faq-6", q: "هل يمكنني تغيير موعد الاستشارة بعد الحجز؟", a: "بالتأكيد، يمكنك التواصل معنا عبر واتساب أو الهاتف قبل 24 ساعة على الأقل من الموعد لإعادة الجدولة دون أي رسوم إضافية.", cat: "الحجز" },
    { id: "faq-7", q: "ما هي تكلفة الاستشارة القانونية؟", a: "تختلف التكلفة حسب التخصص والمحامي ونوع الاستشارة، وتظهر لك بوضوح قبل إتمام الحجز، ويمكنك أيضًا استخدام حاسبة الرسوم التقديرية.", cat: "الدفع" },
  ],

  bookings: [],   // تُملأ من العملاء
  clients: [],
  payments: [],
  ratings: [],
  availability: {
    // أيام الأسبوع المتاحة والفترات الافتراضية لكل محامٍ
    "law-1": { days: [0,1,2,3,4], slots: ["10:00","12:00","14:00","16:00"] },
    "law-2": { days: [0,1,2,3,4], slots: ["11:00","13:00","15:00"] },
    "law-3": { days: [0,2,4], slots: ["10:00","12:00","17:00"] },
    "law-4": { days: [0,1,3,4], slots: ["09:00","11:00","13:00"] },
    "law-5": { days: [1,2,3], slots: ["10:00","14:00","16:00"] },
  },
  admin: { username: "admin", password: "admin123" }, // بيانات دخول تجريبية للوحة التحكم
};

function loadDB() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    localStorage.setItem(DB_KEY, JSON.stringify(SEED));
    return JSON.parse(JSON.stringify(SEED));
  }
  try {
    const parsed = JSON.parse(raw);
    // دمج أي مفاتيح جديدة أضيفت لاحقًا للنسخة الأولية دون فقدان بيانات المستخدم
    return { ...SEED, ...parsed };
  } catch (e) {
    localStorage.setItem(DB_KEY, JSON.stringify(SEED));
    return JSON.parse(JSON.stringify(SEED));
  }
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function uid(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * LocalStore: واجهة موحدة للتعامل مع البيانات.
 * عند الربط مع Supabase، استبدل جسم كل دالة باستدعاء supabase-js
 * المكافئ (select/insert/update/delete) مع إبقاء نفس اسم الدالة
 * ونفس القيمة المُعادة حتى لا تحتاج لتعديل بقية الموقع.
 */
window.LocalStore = {
  async getAll(table) {
    const db = loadDB();
    return db[table] || [];
  },

  async getById(table, id) {
    const db = loadDB();
    return (db[table] || []).find((r) => r.id === id) || null;
  },

  async insert(table, record) {
    const db = loadDB();
    if (!db[table]) db[table] = [];
    const withId = { id: uid(table.slice(0, 3)), createdAt: new Date().toISOString(), ...record };
    db[table].push(withId);
    saveDB(db);
    return withId;
  },

  async update(table, id, patch) {
    const db = loadDB();
    const list = db[table] || [];
    const idx = list.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
    saveDB(db);
    return list[idx];
  },

  async remove(table, id) {
    const db = loadDB();
    db[table] = (db[table] || []).filter((r) => r.id !== id);
    saveDB(db);
    return true;
  },

  async setAll(table, records) {
    const db = loadDB();
    db[table] = records;
    saveDB(db);
    return records;
  },

  async login(username, password) {
    const db = loadDB();
    return db.admin.username === username && db.admin.password === password;
  },
};

/** تحويل ملف مرفوع إلى base64 لإرساله ضمن JSON إلى n8n */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
