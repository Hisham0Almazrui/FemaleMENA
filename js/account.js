(() => {
  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const en = () => localStorage.getItem("mh-lang") === "en";
  const tx = (ar, english) => (en() ? english : ar);
  let me = null;

  const NAV = [
    ["overview", "نظرة عامة", "Overview", "tournaments.view"],
    ["users", "الحسابات", "Accounts", "users.manage"],
    ["roles", "الصلاحيات", "Permissions", "roles.manage"],
    ["tournaments", "البطولات", "Tournaments", "tournaments.view"],
    ["matches", "المباريات", "Matches", "matches.view"],
    ["teams", "الفرق", "Teams", "team.own"],
    ["announcements", "الإعلانات", "Announcements", "announcements.manage"],
    ["sponsors", "الشركاء", "Sponsors", "sponsors.manage"],
    ["settings", "الإعدادات", "Settings", "settings.manage"],
    ["database", "قاعدة البيانات", "Database", "database.view"],
    ["logs", "سجل النشاط", "Audit log", "logs.view"],
    ["moderation", "الإشراف", "Moderation", "chat.moderate"],
    ["standings", "الترتيب", "Standings", "standings.view"],
    ["notifications", "التنبيهات", "Notifications", "notifications.view"],
    ["history", "سجلي", "History", "history.view"],
    ["profile", "ملفي", "Profile", "profile.edit"],
  ];

  async function api(path, options = {}) {
    if (window.MHPublished) return window.MHPublished.call(path, options);
    const res = await fetch(path, {
      method: options.method || "GET",
      headers: {
        Authorization: "Bearer " + (localStorage.getItem("mh-token") || ""),
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, ...data };
  }

  function has(key) {
    return Boolean(me && me.permissions.includes(key));
  }

  function badge(role) {
    const label = { owner: tx("المالك", "Owner"), admin: tx("مشرف", "Admin"), visitor: tx("زائر", "Visitor") }[role] || role;
    return `<span class="role-badge ${esc(role)}">${esc(label)}</span>`;
  }

  function denied() {
    return `<section class="rbac-denied"><h1>${tx("الوصول مرفوض", "Access denied")}</h1><p>${tx("هذا الحساب لا يملك صلاحية هذه الصفحة.", "This account is not allowed to open this page.")}</p></section>`;
  }

  function gate() {
    return `<section class="rbac-denied"><h1>${tx("الوصول مرفوض", "Access denied")}</h1><p>${tx("سجّل الدخول بحساب يملك صلاحية هذه الصفحة.", "Sign in with an account that is allowed to open this page.")}</p><button class="btn primary" type="button" data-act="login">${tx("دخول", "Log in")}</button></section>`;
  }

  function layout(id, body) {
    const items = NAV.filter((item) => has(item[3]))
      .map(([key, ar, english]) => `<a class="${id === key ? "on" : ""}" href="#${key}">${esc(tx(ar, english))}</a>`)
      .join("");
    return `<div class="rbac">
      <aside class="rbac-side">
        <div class="rbac-who">${badge(me.role)}<b>${esc(me.name)}</b><small>${esc(me.email)}</small></div>
        <nav>${items}</nav>
      </aside>
      <section class="rbac-main">${body}</section>
    </div>`;
  }

  async function overview() {
    const stats = await api("/api/stats");
    const news = await api("/api/announcements");
    const cards = [];
    if (stats.ok) {
      if (stats.users != null) cards.push([tx("الحسابات", "Accounts"), stats.users]);
      cards.push([tx("البطولات", "Tournaments"), stats.tournaments]);
      cards.push([tx("المباريات", "Matches"), stats.matches]);
      cards.push([tx("بانتظار الموافقة", "Pending"), stats.pending]);
    }
    const list = (news.announcements || []).slice(0, 3).map((item) => `<li><b>${esc(item.title)}</b><span>${esc(item.body)}</span></li>`).join("");
    return `<header class="rbac-head"><h1>${tx("لوحة الحساب", "Account desk")}</h1>${badge(me.role)}</header>
      <div class="rbac-cards">${cards.map(([label, n]) => `<article><span>${esc(label)}</span><b>${esc(n)}</b></article>`).join("")}</div>
      <article class="rbac-block"><h2>${tx("الإعلانات", "Announcements")}</h2><ul class="rbac-list">${list || `<li>${tx("لا توجد إعلانات.", "No announcements.")}</li>`}</ul></article>`;
  }

  async function users() {
    const data = await api("/api/users");
    if (!data.ok) return denied();
    const rows = data.users
      .map(
        (user) => `<tr>
        <td>${esc(user.name)}<small>${esc(user.email)}</small></td>
        <td>${badge(user.role)}</td>
        <td>${esc(user.status)}</td>
        <td>
          <button type="button" data-user="${user.id}" data-status="${user.status === "active" ? "suspended" : "active"}">${user.status === "active" ? tx("إيقاف", "Suspend") : tx("تفعيل", "Restore")}</button>
          ${user.role === "owner" ? "" : `<button type="button" data-del="${user.id}">${tx("حذف", "Delete")}</button>`}
        </td>
      </tr>`
      )
      .join("");
    return `<header class="rbac-head"><h1>${tx("إدارة الحسابات", "Account management")}</h1></header>
      <form class="rbac-form" data-create-user>
        <input name="name" required placeholder="${tx("الاسم", "Name")}" />
        <input name="email" type="email" required placeholder="${tx("البريد", "Email")}" />
        <input name="password" type="password" minlength="8" required placeholder="${tx("كلمة المرور", "Password")}" />
        <select name="role"><option value="visitor">${tx("زائر", "Visitor")}</option><option value="admin">${tx("مشرف", "Admin")}</option><option value="owner">${tx("مالك", "Owner")}</option></select>
        <button class="btn primary" type="submit">${tx("إنشاء", "Create")}</button>
      </form>
      <div class="rbac-table"><table><tbody>${rows}</tbody></table></div>`;
  }

  async function roles() {
    const data = await api("/api/roles");
    if (!data.ok) return denied();
    const blocks = data.roles
      .map((role) => {
        const keys = data.links.filter((link) => link.role_id === role.id).map((link) => link.permission_id);
        const items = data.permissions
          .filter((perm) => keys.includes(perm.id))
          .map((perm) => `<li>${esc(perm.label)}</li>`)
          .join("");
        return `<article class="rbac-block"><h2>${badge(role.key)}</h2><ul>${items}</ul></article>`;
      })
      .join("");
    return `<header class="rbac-head"><h1>${tx("الأدوار والصلاحيات", "Roles and permissions")}</h1></header><div class="rbac-split">${blocks}</div>`;
  }

  const MAP_POOLS = {
    hardpoint: ["Lithium", "Lotus", "Munition", "Reactor U92", "Rooftops", "Sentry"],
    snd: ["Coal", "Lotus", "Munition", "Reactor U92", "Rooftops", "Silkworm"],
    hijack: ["Lithium", "Lotus", "Munition"],
  };
  const WIZ_STEPS = [
    ["الاسم والتواريخ", "Name, dates & images"],
    ["النظام والقوانين", "Format & rules"],
    ["التسجيل", "Entrants & registration"],
    ["الخرائط", "Maps & match settings"],
    ["المراجعة", "Review & create"],
  ];
  let cupDraft = null;
  let cupStep = 1;
  let editingId = null;
  let cupRows = [];
  let cupError = "";
  let cupNote = "";

  function blankDraft() {
    return {
      game: "cod",
      name: "",
      summary: "",
      prize: "",
      currency: "SAR",
      prizeNote: "",
      visibility: "public",
      status: "draft",
      startAt: "",
      endAt: "",
      cardName: "",
      bannerName: "",
      stages: [{ name: "", format: "single", match: "BO3", final: "BO5", third: false }],
      rules: "Disconnects at the start of a map restart that map. A no-show 10 minutes after the match time loses by forfeit. Cheats and exploited bugs lead to disqualification.",
      info: "",
      entry: "teams",
      cap: 16,
      teamSize: "fixed",
      players: 4,
      regOpen: "",
      regClose: "",
      approval: false,
      waitlist: false,
      seeding: false,
      checkin: false,
      bonus: 0,
      season: "",
      veto: true,
      vetoMethod: "ban",
      maps: {
        hardpoint: MAP_POOLS.hardpoint.slice(),
        snd: MAP_POOLS.snd.slice(),
        hijack: MAP_POOLS.hijack.slice(),
      },
      mvp: "auto",
      ranking: true,
      responseMin: 60,
      noShow: 10,
      hideStream: true,
    };
  }

  function when(value, options) {
    if (!value) return "—";
    return window.MHWhen ? window.MHWhen.format(value, options) || "—" : String(value).replace("T", " ");
  }

  function statusWord(status) {
    const names = {
      draft: ["مسودة", "Draft"],
      pending: ["بانتظار المراجعة", "Pending"],
      open: ["مفتوحة", "Open"],
      live: ["جارية", "Live"],
      ended: ["منتهية", "Ended"],
      rejected: ["مرفوضة", "Rejected"],
    };
    const pair = names[status] || [status, status];
    return tx(pair[0], pair[1]);
  }

  function wizardHtml() {
    const step = cupStep;
    const pills = WIZ_STEPS.map((labels, index) => {
      const n = index + 1;
      const state = n < step ? "done" : n === step ? "on" : "";
      return `<button type="button" class="wiz-pill ${state}" data-wiz-go="${n}"><i>${n < step ? "✓" : n}</i>${esc(tx(labels[0], labels[1]))}</button>`;
    }).join("");
    return `<div class="wiz-back"><form class="wiz" data-wiz-form>
      <header class="wiz-top">
        <div><h2>${editingId ? tx("تعديل البطولة", "Edit tournament") : tx("إنشاء بطولة", "Create tournament")}</h2><p>${editingId ? tx("التعديلات تُحفظ على هذه البطولة.", "Changes are saved on this tournament.") : tx("كل خطوة تُراجع قبل التالية. تظهر البطولة في صفحة البطولات.", "Each step is checked before the next. The tournament appears on the tournaments page.")}</p></div>
        <button type="button" data-wiz="close" aria-label="${tx("إغلاق", "Close")}">✕</button>
      </header>
      <div class="wiz-steps"><span>${tx("الخطوة", "Step")} ${step} / 5</span><div>${pills}</div></div>
      ${cupError ? `<p class="wiz-error">${esc(cupError)}</p>` : cupNote ? `<p class="wiz-note">${esc(cupNote)}</p>` : ""}
      <div class="wiz-body">${step === 1 ? stepBasics() : step === 2 ? stepFormat() : step === 3 ? stepEntrants() : step === 4 ? stepMaps() : stepReview()}</div>
      <footer class="wiz-foot">
        <button type="button" data-wiz="save">${tx("حفظ المسودة", "Save draft now")}</button>
        <div>
          <button type="button" data-wiz="prev" ${step === 1 ? "disabled" : ""}>${tx("السابق", "Previous")}</button>
          <button type="button" class="btn primary" data-wiz="next">${step === 5 ? (editingId ? tx("حفظ التعديل", "Save changes") : tx("إنشاء البطولة", "Create tournament")) : tx("التالي", "Next")}</button>
        </div>
      </footer>
    </form></div>`;
  }

  function dateField(name, label, value) {
    return `<label>${esc(label)}<input type="datetime-local" name="${name}" value="${esc(value || "")}" /></label>`;
  }

  function stepBasics() {
    const d = cupDraft;
    return `<section class="wiz-card"><h3>${tx("الأساسيات", "Basics")}</h3><p>${tx("اللعبة والاسم وما يراه اللاعب أولاً.", "The game, the name and what players see first.")}</p>
      <span class="wiz-label">${tx("اللعبة", "Game")}</span>
      <div class="wiz-games">
        <button type="button" class="${d.game === "cod" ? "on" : ""}" data-game="cod"><img src="media/logo-cod.png?v=3" alt="" />Call of Duty</button>
        <button type="button" class="${d.game === "valorant" ? "on" : ""}" data-game="valorant"><img src="media/logo-valorant.png?v=3" alt="" />Valorant</button>
      </div>
      <input type="hidden" name="game" value="${esc(d.game)}" />
      <label>${tx("الاسم", "Name")}<input name="name" required value="${esc(d.name)}" /></label>
      <label>${tx("الوصف", "Description")}<textarea name="summary">${esc(d.summary)}</textarea></label>
    </section>
    <div class="wiz-grid">
      <section class="wiz-card"><h3>${tx("الجائزة", "Prize")}</h3>
        <div class="wiz-grid tight">
          <label>${tx("المبلغ", "Amount")}<input name="prize" value="${esc(d.prize)}" placeholder="${tx("اختياري", "Optional")}" /></label>
          <label>${tx("العملة", "Currency")}<select name="currency"><option value="SAR" ${d.currency === "SAR" ? "selected" : ""}>${tx("ريال سعودي", "Saudi riyal")}</option><option value="USD" ${d.currency === "USD" ? "selected" : ""}>USD</option></select></label>
        </div>
        <label>${tx("وصف إضافي", "Additional description")}<input name="prizeNote" value="${esc(d.prizeNote)}" /></label>
      </section>
      <section class="wiz-card"><h3>${tx("الظهور", "Visibility")}</h3>
        <label>${tx("من يستطيع فتح البطولة", "Who can open it")}<select name="visibility"><option value="public" ${d.visibility === "public" ? "selected" : ""}>${tx("عامة", "Public")}</option><option value="link" ${d.visibility === "link" ? "selected" : ""}>${tx("بالرابط", "Link only")}</option><option value="private" ${d.visibility === "private" ? "selected" : ""}>${tx("خاصة", "Private")}</option></select></label>
      </section>
    </div>
    <section class="wiz-card"><h3>${tx("التواريخ", "Dates")}</h3><p>${tx("الوقت بتوقيت جهازك، ويُحفظ بالتوقيت العالمي. القادمة والجارية والمنتهية تُحسب من البداية والنهاية، ويمكنك تثبيت جارية أو منتهية.", "Times use your local timezone and are stored in UTC. Upcoming, live, and finished follow the dates. Choose Live or Ended to pin the status.")}</p>
      <label>${tx("الحالة", "Status")}<select name="status">${["draft", "pending", "open", "live", "ended"].map((key) => `<option value="${key}" ${d.status === key ? "selected" : ""}>${esc(statusWord(key))}</option>`).join("")}${d.status === "rejected" ? `<option value="rejected" selected>${esc(statusWord("rejected"))}</option>` : ""}</select></label>
      <div class="wiz-grid tight">${dateField("startAt", tx("بداية البطولة", "Tournament starts"), d.startAt)}${dateField("endAt", tx("نهاية البطولة", "Tournament ends"), d.endAt)}</div>
    </section>
    <section class="wiz-card"><h3>${tx("الصور", "Images")}</h3>
      <p>${tx("تُضبط الصورة تلقائيًا على مقاس البطاقة وغلاف الصفحة. لا تحتاج إلى قصها.", "The picture is resized automatically for the card and the page banner. You do not need to crop it.")}</p>
      <div class="wiz-grid">
        ${fileField("cardFile", tx("صورة البطاقة", "Card artwork"), d.cardName, d.cardData || d.cardUrl, "card")}
        ${fileField("bannerFile", tx("غلاف الصفحة", "Page banner"), d.bannerName, d.bannerData || d.bannerUrl, "banner")}
      </div>
    </section>`;
  }

  function fileField(name, label, chosen, preview, ratio) {
    const src = preview && (String(preview).startsWith("data:image/") || String(preview).startsWith("media/cups/")) ? preview : "";
    return `<label>${esc(label)}${src ? `<img class="wiz-preview ${ratio}" src="${esc(src)}" alt="" />` : ""}<input type="file" name="${name}" accept="image/png,image/jpeg,image/webp" /><small>${esc(chosen || tx("لم يُختر ملف", "No file chosen"))}</small></label>`;
  }

  const FRAMES = {
    card: { w: 1200, h: 720 },
    banner: { w: 1600, h: 560 },
  };

  function readImageFile(file, frame) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = frame.w;
        canvas.height = frame.h;
        const scale = Math.max(frame.w / img.width, frame.h / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        const dx = (frame.w - dw) / 2;
        const dy = (frame.h - dh) * 0.32;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#101014";
        ctx.fillRect(0, 0, frame.w, frame.h);
        ctx.drawImage(img, dx, dy, dw, dh);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.86));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve("");
      };
      img.src = url;
    });
  }

  let imageReads = Promise.resolve();

  function queueImage(input) {
    const file = input.files && input.files[0];
    if (!file || !cupDraft) return;
    const key = input.name.replace("File", "");
    const frame = FRAMES[key];
    if (!frame) return;
    cupDraft[key + "Name"] = file.name;
    imageReads = imageReads.then(async () => {
      const data = await readImageFile(file, frame);
      if (!data || !cupDraft) return;
      cupDraft[key + "Data"] = data;
      const parent = input.parentElement;
      if (parent) {
        let preview = parent.querySelector("img");
        if (!preview) {
          preview = document.createElement("img");
          preview.className = `wiz-preview ${key === "banner" ? "banner" : "card"}`;
          preview.alt = "";
          parent.insertBefore(preview, input);
        }
        preview.src = data;
      }
    });
  }

  function stepFormat() {
    const d = cupDraft;
    const stages = d.stages
      .map(
        (stage, index) => `<div class="wiz-stage" data-stage>
        <b>${index + 1}</b>
        <label>${tx("اسم المرحلة", "Stage name")}<input name="stageName" value="${esc(stage.name)}" /></label>
        <label>${tx("النظام", "Format")}<select name="stageFormat"><option value="single" ${stage.format === "single" ? "selected" : ""}>${tx("خروج مباشر", "Single elimination")}</option><option value="double" ${stage.format === "double" ? "selected" : ""}>${tx("خروج مزدوج", "Double elimination")}</option></select></label>
        <div class="wiz-grid tight">
          <label>${tx("نظام المباراة", "Match format")}<select name="stageMatch">${["BO1", "BO3", "BO5"].map((item) => `<option ${stage.match === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
          <label>${tx("النهائي", "Final")}<select name="stageFinal">${["BO3", "BO5", "BO7"].map((item) => `<option ${stage.final === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
        </div>
        <label class="wiz-check"><input type="checkbox" name="stageThird" ${stage.third ? "checked" : ""} />${tx("مباراة المركز الثالث", "3rd-place match")}</label>
      </div>`
      )
      .join("");
    return `<section class="wiz-card"><h3>${tx("المراحل", "Stages")}</h3>${stages}<button type="button" data-wiz="add">${tx("إضافة مرحلة", "+ Add another stage")}</button></section>
      <section class="wiz-card"><h3>${tx("القوانين", "Rules")}</h3><textarea name="rules">${esc(d.rules)}</textarea></section>
      <section class="wiz-card"><h3>${tx("معلومات مهمة", "Important information")}</h3><textarea name="info">${esc(d.info)}</textarea></section>`;
  }

  function stepEntrants() {
    const d = cupDraft;
    const box = (name, label) => `<label class="wiz-check"><input type="checkbox" name="${name}" ${d[name] ? "checked" : ""} />${esc(label)}</label>`;
    return `<div class="wiz-grid">
      <section class="wiz-card"><h3>${tx("المشاركون", "Entrants")}</h3>
        <label>${tx("نوع الاشتراك", "Entry type")}<select name="entry"><option value="teams" ${d.entry === "teams" ? "selected" : ""}>${tx("فرق", "Teams")}</option><option value="solo" ${d.entry === "solo" ? "selected" : ""}>${tx("فردي", "Solo")}</option></select></label>
        <label>${tx("عدد الفرق", "Number of teams")}<input name="cap" type="number" min="2" max="512" value="${esc(d.cap)}" /></label>
        <div class="wiz-grid tight">
          <label>${tx("حجم الفريق", "Team size")}<select name="teamSize"><option value="fixed" ${d.teamSize === "fixed" ? "selected" : ""}>${tx("ثابت", "Fixed")}</option><option value="range" ${d.teamSize === "range" ? "selected" : ""}>${tx("مدى", "Range")}</option></select></label>
          <label>${tx("اللاعبون", "Players")}<input name="players" type="number" min="1" max="10" value="${esc(d.players)}" /></label>
        </div>
      </section>
      <section class="wiz-card"><h3>${tx("التسجيل", "Registration")}</h3>
        ${dateField("regOpen", tx("فتح التسجيل", "Registration opens"), d.regOpen)}
        ${dateField("regClose", tx("إغلاق التسجيل", "Registration closes"), d.regClose)}
        ${box("approval", tx("التسجيل يحتاج موافقة", "Registrations require approval"))}
        ${box("waitlist", tx("قائمة انتظار", "Waitlist"))}
        ${box("seeding", tx("توزيع عشوائي", "Random seeding"))}
        ${box("checkin", tx("تسجيل حضور قبل البطولة", "Require check-in"))}
      </section>
    </div>`;
  }

  function stepMaps() {
    const d = cupDraft;
    const pools = Object.entries(MAP_POOLS)
      .map(([pool, maps]) => {
        const title = pool === "snd" ? "Search & Destroy" : pool === "hardpoint" ? "Hardpoint" : "Hijack";
        const boxes = maps
          .map((map) => `<label class="wiz-check"><input type="checkbox" data-map data-pool="${pool}" value="${esc(map)}" ${(d.maps[pool] || []).includes(map) ? "checked" : ""} />${esc(map)}</label>`)
          .join("");
        return `<div><h4>${title}</h4>${boxes}</div>`;
      })
      .join("");
    return `<section class="wiz-card"><h3>${tx("الخرائط", "Maps")}</h3>
      <label class="wiz-check"><input type="checkbox" name="veto" ${d.veto ? "checked" : ""} />${tx("اختيار الخرائط", "Map veto")}</label>
      <label>${tx("طريقة الاختيار", "Map selection method")}<select name="vetoMethod"><option value="ban" ${d.vetoMethod === "ban" ? "selected" : ""}>${tx("حظر واختيار بالتناوب", "Ban & pick in turns")}</option><option value="random" ${d.vetoMethod === "random" ? "selected" : ""}>${tx("سحب عشوائي", "Random draw from the pool")}</option></select></label>
      <div class="wiz-grid three">${pools}</div>
    </section>
    <section class="wiz-card"><h3>${tx("توقيت المباراة", "Match timing")}</h3>
      <label>${tx("اختيار أفضل لاعب", "MVP selection")}<select name="mvp"><option value="auto" ${d.mvp === "auto" ? "selected" : ""}>${tx("تلقائي", "Automatic game model")}</option><option value="organizer" ${d.mvp === "organizer" ? "selected" : ""}>${tx("اختيار المنظم", "Organizer picks")}</option></select></label>
      <label class="wiz-check"><input type="checkbox" name="ranking" ${d.ranking ? "checked" : ""} />${tx("إظهار ترتيب الأداء", "Show performance ranking")}</label>
      <div class="wiz-grid tight">
        <label>${tx("مهلة النتيجة بالدقائق", "Result response time")}<input name="responseMin" type="number" min="0" value="${esc(d.responseMin)}" /></label>
        <label>${tx("مهلة الغياب بالدقائق", "No-show time")}<input name="noShow" type="number" min="0" value="${esc(d.noShow)}" /></label>
      </div>
      <label class="wiz-check"><input type="checkbox" name="hideStream" ${d.hideStream ? "checked" : ""} />${tx("إخفاء بث الفريق عن الخصم", "Hide each team's stream from its opponent")}</label>
    </section>`;
  }

  function stepReview() {
    const d = cupDraft;
    const stage = d.stages[0] || {};
    const maps = (pool) => (d.maps[pool] || []).length;
    const card = (title, rows) => `<article class="wiz-card"><h3>${esc(title)}</h3><dl>${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl></article>`;
    return `<div class="wiz-grid three">
      ${card(tx("الاسم والتواريخ", "Name, dates & images"), [[tx("الاسم", "Name"), d.name || "—"], [tx("اللعبة", "Game"), d.game === "valorant" ? "Valorant" : "Call of Duty"], [tx("الحالة", "Status"), statusWord(d.status || "draft")], [tx("الظهور", "Visibility"), d.visibility], [tx("الجائزة", "Prize"), d.prize || tx("لا يوجد", "None")], [tx("البداية", "Starts"), when(d.startAt)], [tx("النهاية", "Ends"), when(d.endAt)]])}
      ${card(tx("النظام", "Format & rules"), [[tx("المرحلة", "Stage"), stage.format === "double" ? tx("خروج مزدوج", "Double elimination") : tx("خروج مباشر", "Single elimination")], [tx("المباريات", "Matches"), `${stage.match || "BO3"} · ${tx("النهائي", "Final")} ${stage.final || "BO5"}`]])}
      ${card(tx("التسجيل", "Entrants & registration"), [[tx("النوع", "Type"), d.entry], [tx("العدد", "Participants"), d.cap], [tx("حجم الفريق", "Team size"), d.players], [tx("فتح التسجيل", "Registration opens"), when(d.regOpen)], [tx("إغلاق التسجيل", "Registration closes"), when(d.regClose)]])}
      ${card(tx("الخرائط", "Maps & match settings"), [["Hardpoint", `${maps("hardpoint")} ${tx("خرائط", "maps")}`], ["Search & Destroy", `${maps("snd")} ${tx("خرائط", "maps")}`], ["Hijack", `${maps("hijack")} ${tx("خرائط", "maps")}`]])}
    </div>`;
  }

  function readWizard(form) {
    if (!form || !cupDraft) return;
    const take = (name) => {
      const el = form.querySelector(`[name="${name}"]`);
      if (el && el.type !== "checkbox" && el.type !== "file") cupDraft[name] = el.value;
    };
    ["game", "name", "summary", "prize", "currency", "prizeNote", "visibility", "status", "startAt", "endAt", "rules", "info", "entry", "cap", "teamSize", "players", "regOpen", "regClose", "bonus", "season", "vetoMethod", "mvp", "responseMin", "noShow"].forEach(take);
    ["approval", "waitlist", "seeding", "checkin", "veto", "ranking", "hideStream"].forEach((name) => {
      const el = form.querySelector(`[name="${name}"]`);
      if (el) cupDraft[name] = el.checked;
    });
    const stages = [...form.querySelectorAll("[data-stage]")].map((node) => ({
      name: node.querySelector("[name=stageName]").value,
      format: node.querySelector("[name=stageFormat]").value,
      match: node.querySelector("[name=stageMatch]").value,
      final: node.querySelector("[name=stageFinal]").value,
      third: node.querySelector("[name=stageThird]").checked,
    }));
    if (stages.length) cupDraft.stages = stages;
    if (form.querySelector("[data-map]")) {
      const maps = { hardpoint: [], snd: [], hijack: [] };
      form.querySelectorAll("[data-map]").forEach((input) => {
        if (input.checked) maps[input.dataset.pool].push(input.value);
      });
      cupDraft.maps = maps;
    }
    ["card", "banner"].forEach((key) => {
      const input = form.querySelector(`[name="${key}File"]`);
      if (input && input.files && input.files[0]) cupDraft[key + "Name"] = input.files[0].name;
    });
    if (!editingId) {
      const saved = { ...cupDraft };
      delete saved.cardData;
      delete saved.bannerData;
      localStorage.setItem("mh-cup-draft", JSON.stringify(saved));
    }
  }

  function validStep() {
    if (cupStep !== 1) return true;
    if (String(cupDraft.name || "").trim().length < 2) {
      cupError = tx("اكتب اسم البطولة.", "Enter the tournament name.");
      return false;
    }
    if (!cupDraft.startAt || !cupDraft.endAt) {
      cupError = tx("اختر تاريخ البداية وتاريخ النهاية.", "Choose a start date and an end date.");
      return false;
    }
    if (cupDraft.endAt <= cupDraft.startAt) {
      cupError = tx("تاريخ النهاية يجب أن يكون بعد البداية.", "The end date must be after the start date.");
      return false;
    }
    return true;
  }

  function localDate(value) {
    return window.MHWhen ? window.MHWhen.toInput(value) : "";
  }

  function datedDraft() {
    const copy = { ...cupDraft };
    ["startAt", "endAt", "regOpen", "regClose"].forEach((key) => {
      copy[key] = window.MHWhen ? window.MHWhen.toUtc(copy[key]) : copy[key];
    });
    return copy;
  }

  async function publishCup() {
    const details = datedDraft();
    const payload = {
      name: cupDraft.name,
      game: cupDraft.game,
      summary: cupDraft.summary,
      status: cupDraft.status || "draft",
      startAt: details.startAt,
      endAt: details.endAt,
      cap: Number(cupDraft.cap) || 16,
      details,
    };
    const result = await api(editingId ? `/api/tournaments/${editingId}` : "/api/tournaments", {
      method: editingId ? "PATCH" : "POST",
      body: payload,
    });
    if (!result.ok) {
      cupError = editingId ? tx("تعذر حفظ البطولة.", "The tournament could not be saved.") : tx("تعذر إنشاء البطولة.", "The tournament could not be created.");
      draw();
      return;
    }
    if (window.MHWhen) window.MHWhen.announce(result.id || editingId);
    localStorage.removeItem("mh-cup-draft");
    cupDraft = null;
    editingId = null;
    cupStep = 1;
    cupError = "";
    cupNote = "";
    draw();
  }

  function openWizard() {
    try {
      cupDraft = JSON.parse(localStorage.getItem("mh-cup-draft") || "null") || blankDraft();
    } catch {
      cupDraft = blankDraft();
    }
    if (!Array.isArray(cupDraft.stages) || !cupDraft.stages.length) cupDraft.stages = blankDraft().stages;
    if (!cupDraft.maps) cupDraft.maps = blankDraft().maps;
    editingId = null;
    cupStep = 1;
    cupError = "";
    cupNote = "";
    draw();
  }

  function openEdit(id) {
    const row = cupRows.find((cup) => String(cup.id) === String(id));
    if (!row) return;
    let details = {};
    try {
      details = JSON.parse(row.details || "{}");
    } catch {
      details = {};
    }
    cupDraft = {
      ...blankDraft(),
      ...details,
      game: row.game === "valorant" ? "valorant" : "cod",
      name: row.name,
      summary: row.summary || details.summary || "",
      startAt: localDate(row.start_at) || localDate(details.startAt),
      endAt: localDate(row.end_at) || localDate(details.endAt),
      status: row.status || "draft",
      cap: row.cap || details.cap || 16,
    };
    if (!Array.isArray(cupDraft.stages) || !cupDraft.stages.length) cupDraft.stages = blankDraft().stages;
    if (!cupDraft.maps) cupDraft.maps = blankDraft().maps;
    delete cupDraft.logoName;
    delete cupDraft.logoData;
    delete cupDraft.logoUrl;
    editingId = row.id;
    cupStep = 1;
    cupError = "";
    cupNote = "";
    draw();
  }

  async function goStep(step, form) {
    readWizard(form);
    await imageReads;
    if (step > cupStep && !validStep()) {
      draw();
      return;
    }
    cupStep = Math.min(5, Math.max(1, step));
    cupError = "";
    cupNote = "";
    draw();
  }

  async function wizardAction(action, form) {
    readWizard(form);
    await imageReads;
    if (action === "close") {
      cupDraft = null;
      editingId = null;
      cupError = "";
      cupNote = "";
      draw();
      return;
    }
    if (action === "save") {
      cupError = "";
      cupNote = tx("تم حفظ المسودة في هذا المتصفح.", "Draft saved in this browser.");
      draw();
      return;
    }
    if (action === "add") {
      cupDraft.stages.push({ name: "", format: "single", match: "BO3", final: "BO5", third: false });
      cupNote = "";
      draw();
      return;
    }
    if (action === "prev") {
      cupStep = Math.max(1, cupStep - 1);
      cupError = "";
      cupNote = "";
      draw();
      return;
    }
    if (!validStep()) {
      cupNote = "";
      draw();
      return;
    }
    if (cupStep < 5) {
      cupStep += 1;
      cupError = "";
      cupNote = "";
      draw();
      return;
    }
    publishCup();
  }

  async function tournaments() {
    const data = await api("/api/tournaments");
    if (!data.ok) return denied();
    const manage = has("tournaments.manage");
    const approve = has("tournaments.approve");
    cupRows = data.tournaments;
    const rows = data.tournaments
      .map(
        (cup) => {
          const start = window.MHWhen ? window.MHWhen.format(cup.start_at, { short: true }) : "";
          return `<article class="rbac-block cup-admin">
        <h2>${esc(cup.name)}<small>${esc(cup.game === "valorant" ? "Valorant" : "Call of Duty")}</small></h2>
        <p class="cup-line"><span>${esc(statusWord(cup.status))}</span>${start ? `<span>${esc(start)}</span>` : ""}<span>${cup.seats}/${cup.cap}</span></p>
        <div class="cup-acts">
          ${
            approve && (cup.status === "pending" || cup.status === "draft")
              ? `<button type="button" data-decide="${cup.id}" data-choice="approve">${tx("قبول", "Approve")}</button><button type="button" data-decide="${cup.id}" data-choice="reject">${tx("رفض", "Reject")}</button>`
              : ""
          }
          ${manage ? `<button type="button" data-edit-cup="${cup.id}">${tx("تعديل", "Edit")}</button><button type="button" data-drop-cup="${cup.id}">${tx("حذف", "Delete")}</button>` : ""}
          ${!manage && has("tournaments.join") && cup.status === "open" ? `<button type="button" data-join="${cup.id}">${tx("تسجيل فريقي", "Enter my team")}</button>` : ""}
        </div>
      </article>`;
        }
      )
      .join("");
    const form = manage
      ? `<div class="rbac-form"><button class="btn primary" type="button" data-open-wizard>${tx("إنشاء", "Create")}</button></div>`
      : "";
    return `<header class="rbac-head"><h1>${tx("البطولات", "Tournaments")}</h1></header>${form}<div class="rbac-split">${rows}</div>${cupDraft ? wizardHtml() : ""}`;
  }

  async function matches() {
    const data = await api("/api/matches");
    const cups = await api("/api/tournaments");
    if (!data.ok) return denied();
    const manage = has("matches.manage");
    const rows = data.matches
      .map(
        (match) => `<tr>
        <td>${esc(match.tournament)}</td>
        <td>${esc(when(match.start_at))}</td>
        <td>${esc(match.round)}</td>
        <td>${esc(match.team_a)} ${match.score_a ?? "–"} : ${match.score_b ?? "–"} ${esc(match.team_b)}</td>
        <td>${esc(match.status)}</td>
        ${
          has("results.update")
            ? `<td><button type="button" data-score="${match.id}" data-a="${match.score_a ?? 0}" data-b="${match.score_b ?? 0}">${tx("تحديث", "Update")}</button></td>`
            : ""
        }
      </tr>`
      )
      .join("");
    const options = (cups.tournaments || []).map((cup) => `<option value="${cup.id}">${esc(cup.name)}</option>`).join("");
    const form = manage
      ? `<form class="rbac-form" data-create-match>
          <select name="tournamentId">${options}</select>
          <input name="round" placeholder="${tx("الدور", "Round")}" />
          <input name="teamA" placeholder="${tx("الفريق الأول", "Team A")}" />
          <input name="teamB" placeholder="${tx("الفريق الثاني", "Team B")}" />
          <button class="btn primary" type="submit">${tx("إضافة مباراة", "Add match")}</button>
        </form>`
      : "";
    return `<header class="rbac-head"><h1>${tx("المباريات والبراكت", "Matches and brackets")}</h1></header>${form}
      <div class="rbac-table"><table><tbody>${rows}</tbody></table></div>`;
  }

  async function teams() {
    const data = await api("/api/teams");
    if (!data.ok) return denied();
    const manage = has("teams.manage");
    const regs = manage ? await api("/api/registrations") : { registrations: [] };
    const rows = (data.teams || [])
      .map(
        (team) => `<li><b>${esc(team.name)}</b><span>${esc(team.game)} · ${esc(team.status)}</span>
        ${manage ? `<button type="button" data-team="${team.id}" data-status="approved">${tx("قبول", "Approve")}</button><button type="button" data-team="${team.id}" data-status="rejected">${tx("رفض", "Reject")}</button>` : ""}</li>`
      )
      .join("");
    const joins = (regs.registrations || [])
      .map(
        (row) => `<li><b>${esc(row.team)}</b><span>${esc(row.tournament)} · ${esc(when(row.start_at))} · ${esc(row.status)}</span>
        <button type="button" data-reg="${row.id}" data-status="approved">${tx("قبول", "Approve")}</button></li>`
      )
      .join("");
    const form = !data.teams.length
      ? `<form class="rbac-form" data-create-team>
          <input name="name" required placeholder="${tx("اسم الفريق", "Team name")}" />
          <select name="game"><option value="cod">Call of Duty</option><option value="valorant">Valorant</option></select>
          <button class="btn primary" type="submit">${tx("إنشاء فريقي", "Create my team")}</button>
        </form>`
      : "";
    return `<header class="rbac-head"><h1>${tx("الفرق", "Teams")}</h1></header>${form}
      <article class="rbac-block"><ul class="rbac-list">${rows || `<li>${tx("لا يوجد فريق.", "No team yet.")}</li>`}</ul></article>
      ${manage ? `<article class="rbac-block"><h2>${tx("طلبات التسجيل", "Registrations")}</h2><ul class="rbac-list">${joins}</ul></article>` : ""}`;
  }

  async function announcements() {
    const data = await api("/api/announcements");
    if (!has("announcements.manage")) return denied();
    const rows = (data.announcements || []).map((item) => `<li><b>${esc(item.title)}</b><span>${esc(item.body)}</span><button type="button" data-drop-news="${item.id}">${tx("حذف", "Delete")}</button></li>`).join("");
    return `<header class="rbac-head"><h1>${tx("الإعلانات", "Announcements")}</h1></header>
      <form class="rbac-form" data-create-news>
        <input name="title" required placeholder="${tx("العنوان", "Title")}" />
        <input name="body" required placeholder="${tx("النص", "Text")}" />
        <button class="btn primary" type="submit">${tx("نشر", "Publish")}</button>
      </form>
      <ul class="rbac-list">${rows}</ul>`;
  }

  async function sponsors() {
    const data = await api("/api/sponsors");
    if (!data.ok) return denied();
    const rows = data.sponsors.map((item) => `<li><b>${esc(item.name)}</b><span>${esc(item.url || "")}</span><button type="button" data-drop-sponsor="${item.id}">${tx("حذف", "Delete")}</button></li>`).join("");
    return `<header class="rbac-head"><h1>${tx("الشركاء", "Sponsors")}</h1></header>
      <form class="rbac-form" data-create-sponsor>
        <input name="name" required placeholder="${tx("الاسم", "Name")}" />
        <input name="url" placeholder="URL" />
        <button class="btn primary" type="submit">${tx("إضافة", "Add")}</button>
      </form>
      <ul class="rbac-list">${rows}</ul>`;
  }

  async function settings() {
    const data = await api("/api/settings");
    if (!data.ok) return denied();
    const fields = data.settings.map((item) => `<label>${esc(item.key)}<input name="${esc(item.key)}" value="${esc(item.value)}" /></label>`).join("");
    return `<header class="rbac-head"><h1>${tx("إعدادات الموقع", "Site settings")}</h1></header><form class="rbac-form stack" data-settings>${fields}<button class="btn primary" type="submit">${tx("حفظ", "Save")}</button></form>`;
  }

  async function database() {
    const data = await api("/api/database");
    if (!data.ok) return denied();
    return `<header class="rbac-head"><h1>${tx("قاعدة البيانات", "Database")}</h1></header>
      <div class="rbac-cards">${data.tables.map((table) => `<article><span>${esc(table.name)}</span><b>${table.rows}</b></article>`).join("")}</div>
      <p class="muted">${tx("العرض للقراءة فقط. لا يوجد تنفيذ لاستعلامات حرة.", "Read-only summary. Raw queries are not available.")}</p>`;
  }

  async function logs() {
    const data = await api("/api/logs");
    if (!data.ok) return denied();
    const rows = data.logs.map((row) => `<li><b>${esc(row.action)}</b><span>${esc(row.email || "")} · ${esc(row.target || "")} · ${esc(row.created_at)}</span></li>`).join("");
    return `<header class="rbac-head"><h1>${tx("سجل النشاط", "Audit log")}</h1></header><ul class="rbac-list">${rows}</ul>`;
  }

  async function moderation() {
    const data = await api("/api/comments");
    if (!data.ok) return denied();
    const rows = data.comments
      .map(
        (row) => `<li><b>${esc(row.email || "")}</b><span>${esc(row.body)} · ${esc(row.status)}</span>
        <button type="button" data-comment="${row.id}" data-status="${row.status === "hidden" ? "visible" : "hidden"}">${row.status === "hidden" ? tx("إظهار", "Show") : tx("إخفاء", "Hide")}</button></li>`
      )
      .join("");
    return `<header class="rbac-head"><h1>${tx("الإشراف", "Moderation")}</h1></header><ul class="rbac-list">${rows}</ul>`;
  }

  async function standings() {
    const data = await api("/api/standings");
    if (!data.ok) return denied();
    const rows = data.standings.map((row, index) => `<li><b>${index + 1}. ${esc(row.name)}</b><span>${row.wins} - ${row.losses}</span></li>`).join("");
    return `<header class="rbac-head"><h1>${tx("الترتيب", "Standings")}</h1></header><ul class="rbac-list">${rows || `<li>${tx("لا توجد نتائج بعد.", "No finished matches yet.")}</li>`}</ul>`;
  }

  async function notifications() {
    const data = await api("/api/notifications");
    if (!data.ok) return denied();
    const rows = data.notifications.map((row) => `<li><b>${esc(row.body)}</b><span>${esc(row.created_at)}</span></li>`).join("");
    return `<header class="rbac-head"><h1>${tx("التنبيهات", "Notifications")}</h1></header><ul class="rbac-list">${rows || `<li>${tx("لا توجد تنبيهات.", "No notifications.")}</li>`}</ul>`;
  }

  async function history() {
    const data = await api("/api/history");
    if (!data.ok) return denied();
    const rows = data.history.map((row) => `<li><b>${esc(row.name)}</b><span>${esc(row.game)} · ${esc(statusWord(row.status))} · ${esc(when(row.start_at))}</span></li>`).join("");
    return `<header class="rbac-head"><h1>${tx("سجل البطولات", "Tournament history")}</h1></header><ul class="rbac-list">${rows || `<li>${tx("لم تنضم إلى بطولة بعد.", "No entries yet.")}</li>`}</ul>`;
  }

  function profile() {
    return `<header class="rbac-head"><h1>${tx("ملفي", "My profile")}</h1></header>
      <form class="rbac-form stack" data-profile>
        <input name="name" required value="${esc(me.name)}" />
        <input name="password" type="password" minlength="8" placeholder="${tx("كلمة مرور جديدة", "New password")}" />
        <button class="btn primary" type="submit">${tx("حفظ", "Save")}</button>
      </form>`;
  }

  const panels = {
    overview,
    users,
    roles,
    tournaments,
    matches,
    teams,
    announcements,
    sponsors,
    settings,
    database,
    logs,
    moderation,
    standings,
    notifications,
    history,
    profile,
  };

  async function draw() {
    const root = document.getElementById("rbac");
    if (!root || !me) return;
    const id = (location.hash || "#overview").slice(1);
    const item = NAV.find((row) => row[0] === id);
    const allowed = item && has(item[3]);
    const body = allowed ? await panels[id]() : denied();
    root.innerHTML = layout(allowed ? id : "denied", body);
    bind(root);
  }

  function bind(root) {
    root.querySelectorAll("form:not([data-wiz-form])").forEach((form) => form.addEventListener("submit", (event) => submit(event, form)));
    root.querySelectorAll("[data-open-wizard]").forEach((button) => button.addEventListener("click", openWizard));
    root.querySelectorAll("[data-edit-cup]").forEach((button) => button.addEventListener("click", () => openEdit(button.dataset.editCup)));
    const wiz = root.querySelector("[data-wiz-form]");
    if (wiz) {
      wiz.addEventListener("submit", (event) => event.preventDefault());
      wiz.querySelectorAll("[data-wiz]").forEach((button) => button.addEventListener("click", () => wizardAction(button.dataset.wiz, wiz)));
      wiz.querySelectorAll("[data-wiz-go]").forEach((button) => button.addEventListener("click", () => goStep(Number(button.dataset.wizGo), wiz)));
      wiz.querySelectorAll("[data-game]").forEach((button) => button.addEventListener("click", () => {
        wiz.querySelector('[name="game"]').value = button.dataset.game;
        wiz.querySelectorAll("[data-game]").forEach((item) => item.classList.toggle("on", item === button));
      }));
      wiz.querySelectorAll('input[type="file"]').forEach((input) => input.addEventListener("change", () => queueImage(input)));
    }
    root.querySelectorAll("button[data-user]").forEach((button) => button.addEventListener("click", () => act(`/api/users/${button.dataset.user}`, "PATCH", { status: button.dataset.status })));
    root.querySelectorAll("button[data-del]").forEach((button) => button.addEventListener("click", () => act(`/api/users/${button.dataset.del}`, "DELETE")));
    root.querySelectorAll("button[data-decide]").forEach((button) => button.addEventListener("click", () => act(`/api/tournaments/${button.dataset.decide}/decision`, "POST", { decision: button.dataset.choice })));
    root.querySelectorAll("button[data-drop-cup]").forEach((button) => button.addEventListener("click", () => act(`/api/tournaments/${button.dataset.dropCup}`, "DELETE")));
    root.querySelectorAll("button[data-join]").forEach((button) => button.addEventListener("click", () => join(button.dataset.join)));
    root.querySelectorAll("button[data-score]").forEach((button) => button.addEventListener("click", () => act(`/api/matches/${button.dataset.score}`, "PATCH", { scoreA: Number(button.dataset.a) + 1, scoreB: Number(button.dataset.b), status: "finished" })));
    root.querySelectorAll("button[data-team]").forEach((button) => button.addEventListener("click", () => act(`/api/teams/${button.dataset.team}`, "PATCH", { status: button.dataset.status })));
    root.querySelectorAll("button[data-reg]").forEach((button) => button.addEventListener("click", () => act(`/api/registrations/${button.dataset.reg}`, "PATCH", { status: button.dataset.status })));
    root.querySelectorAll("button[data-drop-news]").forEach((button) => button.addEventListener("click", () => act(`/api/announcements/${button.dataset.dropNews}`, "DELETE")));
    root.querySelectorAll("button[data-drop-sponsor]").forEach((button) => button.addEventListener("click", () => act(`/api/sponsors/${button.dataset.dropSponsor}`, "DELETE")));
    root.querySelectorAll("button[data-comment]").forEach((button) => button.addEventListener("click", () => act(`/api/comments/${button.dataset.comment}`, "PATCH", { status: button.dataset.status })));
  }

  async function submit(event, form) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    if (form.dataset.createUser != null) await act("/api/users", "POST", data);
    else if (form.dataset.createCup != null) await act("/api/tournaments", "POST", data);
    else if (form.dataset.createMatch != null) await act("/api/matches", "POST", data);
    else if (form.dataset.createTeam != null) await act("/api/teams", "POST", data);
    else if (form.dataset.createNews != null) await act("/api/announcements", "POST", data);
    else if (form.dataset.createSponsor != null) await act("/api/sponsors", "POST", data);
    else if (form.dataset.settings != null) await act("/api/settings", "PATCH", data);
    else if (form.dataset.profile != null) {
      const result = await api("/api/profile", { method: "PATCH", body: data });
      if (result.ok) {
        me.name = result.name;
        localStorage.setItem("mh-user", result.name);
      }
      draw();
    }
  }

  async function join(tournamentId) {
    const teams = await api("/api/teams");
    const team = (teams.teams || []).find((item) => item.status === "approved");
    if (!team) return draw();
    await act("/api/registrations", "POST", { tournamentId: Number(tournamentId), teamId: team.id });
  }

  async function act(path, method, body) {
    const result = await api(path, { method, body });
    if (result.ok && window.MHWhen && path.indexOf("/api/tournaments") === 0) window.MHWhen.announce();
    draw();
  }

  async function mount() {
    const root = document.getElementById("rbac");
    if (!root) return;
    if (!localStorage.getItem("mh-token")) {
      me = null;
      root.innerHTML = gate();
      return;
    }
    const data = await api("/api/auth/me");
    if (!data.ok) {
      localStorage.removeItem("mh-token");
      localStorage.removeItem("mh-user");
      localStorage.removeItem("mh-role");
      me = null;
      root.innerHTML = gate();
      return;
    }
    me = data.user;
    localStorage.setItem("mh-user", me.name);
    localStorage.setItem("mh-role", me.role);
    draw();
  }

  window.MHAccount = { mount };
  window.addEventListener("hashchange", () => {
    if (document.body.dataset.page === "account") draw();
  });
})();
