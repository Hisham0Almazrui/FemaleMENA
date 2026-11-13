(() => {
  const teams = window.MH_TEAMS || [];
  const players = window.MH_PLAYERS || [];
  const page = document.body.dataset.page || "home";
  const maxPts = teams.reduce((m, t) => Math.max(m, t.points), 1);
  const maxPlayer = players.reduce((m, t) => Math.max(m, t.points), 1);

  const dict = {
    ar: {
      lang: "English",
      login: "دخول",
      signup: "إنشاء حساب",
      menu: "فتح القائمة",
      close: "إغلاق",
      home: "الرئيسية",
      tournaments: "البطولات",
      matches: "المباريات المباشرة",
      leagues: "الدوريات",
      leaderboards: "التصنيفات",
      teams: "الفرق",
      community: "بطولات المجتمع",
      roster: "أكمل تشكيلتك",
      partners: "الشركاء",
      support: "الدعم",
      teamsTab: "الفرق",
      playersTab: "اللاعبون",
      competition: "المنافسة",
      all: "الكل",
      rank: "المركز",
      team: "الفريق",
      player: "اللاعب",
      points: "النقاط",
      titles: "الألقاب",
      wins: "فاز",
      losses: "خسر",
      rate: "نسبة الفوز",
      diff: "فارق الخرائط",
      form: "آخر 5",
      currentTeam: "الفريق الحالي",
      elite: "المراكز 1–8: التأهل المباشر إلى النخبة",
      lcq: "المراكز 9–22: التصفيات الأخيرة",
      how: "كيف تُحتسب النقاط؟",
      teamTitle: "تصنيف الفرق",
      teamLede: "ترتيب الفرق بمجموع نقاط لاعبيها الحاليين من البطولات الرسمية في هذه المنصة، مع إحصائيات كل فريق.",
      playerTitle: "تصنيف اللاعبين",
      playerLede: "ترتيب اللاعبين بنقاطهم من البطولات الرسمية في هذه المنصة. تُقسم نقاط الفريق على لاعبيه، وتنتقل نقاط اللاعب معه.",
      countTeams: (n) => `${n} فريقًا في التصنيف من 3 بطولات رسمية`,
      countPlayers: (n) => `${n} لاعبًا في التصنيف`,
      rosterTitle: "نقاط الفريق هي مجموع نقاط لاعبيه الحاليين",
      noRoster: "لا توجد تشكيلة منشورة لهذا الفريق.",
      footerSlogan: "اللعب يجمعنا. المنافسة تطورنا.",
      rights: "جميع الحقوق محفوظة © 2026 Female MENA",
      start: "كيف تبدأ",
      terms: "الشروط",
      privacy: "الخصوصية",
      cookies: "ملفات الارتباط",
      contact: "الدعم والتواصل",
      follow: "تابعنا",
      motion: "حركة الخلفية",
      on: "مفعّلة",
      off: "متوقفة",
      heroKicker: "مساحة مجتمع Modern Warfare 4",
      heroTitle: "اللعب يجمعنا.<br>والمنافسة تطورنا.",
      heroText: "كوّن فريقك، اختر منافستك، وابدأ اللعب. كل ما تحتاجه لمواجهتك القادمة هنا.",
      createAccount: "أنشئ حسابك",
      createCup: "أنشئ بطولتك الخاصة",
      fullBoard: "عرض التصنيف الكامل",
      recruitTitle: "أكمل تشكيلتك",
      recruitText: "لاعب يبحث عن فريق، وفريق يبحث عن لاعب. التواصل كله من داخل الموقع.",
      lookingTeams: "فرق تبحث عن لاعبين",
      lookingPlayers: "لاعبون يبحثون عن فريق",
      ended: "انتهت",
      emptyLeagues: "المواسم القادمة تظهر هنا عند إعلانها.",
      cookieTitle: "خصوصيتك، واختيارك.",
      cookieBody: "نحسب استخدام الصفحات بصورة مجهولة دون ملفات قياس أو معرّفات. بموافقتك نضيف قياس الجلسات والعودة. أثناء الدخول نسجل أحداث استخدام الحساب لتحسين الخدمة، دون حفظ عنوان IP الكامل.",
      details: "اعرف التفاصيل",
      necessary: "الضروري فقط",
      allow: "السماح بالقياس الاختياري",
      email: "البريد",
      password: "كلمة المرور",
      name: "الاسم",
      haveAccount: "لديك حساب؟ دخول",
      noAccount: "جديد هنا؟ إنشاء حساب",
      welcome: "أهلًا",
      logout: "خروج",
      sent: "تم حفظ رسالتك على هذا الجهاز.",
      message: "الرسالة",
      send: "إرسال",
    },
    en: {
      lang: "العربية",
      login: "Log in",
      signup: "Sign up",
      menu: "Open menu",
      close: "Close",
      home: "Home",
      tournaments: "Tournaments",
      matches: "Live matches",
      leagues: "Leagues",
      leaderboards: "Leaderboards",
      teams: "Teams",
      community: "Community cups",
      roster: "Complete your roster",
      partners: "Partners",
      support: "Support",
      teamsTab: "Teams",
      playersTab: "Players",
      competition: "Competition",
      all: "All",
      rank: "Rank",
      team: "Team",
      player: "Player",
      points: "Points",
      titles: "Titles",
      wins: "Wins",
      losses: "Losses",
      rate: "Win rate",
      diff: "Map diff",
      form: "Last 5",
      currentTeam: "Current team",
      elite: "Ranks 1–8: direct qualification to Elite",
      lcq: "Ranks 9–22: last-chance qualifier",
      how: "How are points scored?",
      teamTitle: "Team rankings",
      teamLede: "Teams ranked by the combined points of their current players from official tournaments on this platform.",
      playerTitle: "Player rankings",
      playerLede: "Players ranked by points earned in official tournaments. Team points are split across the roster and travel with the player.",
      countTeams: (n) => `${n} teams ranked across 3 official tournaments`,
      countPlayers: (n) => `${n} players ranked`,
      rosterTitle: "A team's points are the sum of its current players",
      noRoster: "No published roster for this team.",
      footerSlogan: "Play brings us together. Competition moves us forward.",
      rights: "All rights reserved © 2026 Female MENA",
      start: "Get started",
      terms: "Terms",
      privacy: "Privacy",
      cookies: "Cookies",
      contact: "Support",
      follow: "Follow",
      motion: "Background motion",
      on: "On",
      off: "Off",
      heroKicker: "Modern Warfare 4 community",
      heroTitle: "Play brings us together.<br>Competition moves us forward.",
      heroText: "Build your team, pick your competition, and play. Everything for your next match is here.",
      createAccount: "Create your account",
      createCup: "Create your tournament",
      fullBoard: "View the full ranking",
      recruitTitle: "Complete your roster",
      recruitText: "A player looking for a team, and a team looking for a player.",
      lookingTeams: "Teams looking for players",
      lookingPlayers: "Players looking for a team",
      ended: "Ended",
      emptyLeagues: "Upcoming seasons will appear here when they are announced.",
      cookieTitle: "Your privacy, your choice.",
      cookieBody: "Page use is counted anonymously, without tracking files. With your consent we also measure sessions. Signed-in use is logged to improve the service, without storing a full IP address.",
      details: "Learn more",
      necessary: "Necessary only",
      allow: "Allow optional measurement",
      email: "Email",
      password: "Password",
      name: "Name",
      haveAccount: "Already have an account? Log in",
      noAccount: "New here? Sign up",
      welcome: "Hello",
      logout: "Log out",
      sent: "Your message was saved on this device.",
      message: "Message",
      send: "Send",
    },
  };

  const phrases = [
    ["ضمن أفضل 32", "Top 32"],
    ["ضمن أفضل 16", "Top 16"],
    ["ضمن أفضل 8", "Top 8"],
    ["المركز الرابع", "Fourth"],
    ["المركز الثالث", "Third"],
    ["لم تكتمل بعد", "In progress"],
    ["التصفيات الأخيرة", "Last chance"],
    ["النخبة", "Elite"],
    ["المشاركة", "Participation"],
    ["البطل", "Champion"],
    ["الوصيف", "Runner-up"],
    ["3 بطولات", "3 tournaments"],
    ["بطولتان", "2 tournaments"],
    ["بطولة واحدة", "1 tournament"],
    ["0 بطولة", "0 tournaments"],
  ];

  let lang = localStorage.getItem("mh-lang") || "ar";
  let authMode = null;
  let menuOpen = false;
  let motion = localStorage.getItem("mh-motion") !== "off";
  let user = localStorage.getItem("mh-user") || "";
  let cookie = localStorage.getItem("mh-cookie") || "";
  let cupQuery = "";
  let cupFilter = "all";
  let cupOrder = "new";
  let cupTab = "overview";
  let bracketSide = "all";
  let bracketQuery = "";
  let bracketZoom = 1;
  let bracketFull = false;
  let bracketStatus = "all";

  const t = (k, ...a) => {
    const v = dict[lang][k];
    return typeof v === "function" ? v(...a) : v;
  };
  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const tr = (s) => {
    if (lang !== "en" || !s) return s || "";
    return phrases.reduce((out, [ar, en]) => out.split(ar).join(en), s);
  };
  const slug = (s) =>
    String(s || "")
      .trim()
      .replace(/\s+/g, "-");
  const rate = (s) => String(s || "—").replace(/\s+/g, "");
  const mark = (m) => (m === "W" ? `<b class="w">${lang === "en" ? "W" : "ف"}</b>` : `<b class="l">${lang === "en" ? "L" : "خ"}</b>`);

  const logo = `<img src="media/logo-female.png" alt="Female MENA" />`;

  const nav = [
    ["index.html", "home", "home"],
    ["tournaments.html", "tournaments", "tournaments"],
    ["matches.html", "matches", "matches"],
    ["leagues.html", "leagues", "leagues"],
    ["leaderboards.html", "leaderboards", "leaderboards"],
    ["teams.html", "teams", "teams"],
    ["tournaments.html#community", "community", "community"],
    ["roster.html", "roster", "roster"],
    ["partners.html", "partners", "partners"],
    ["support.html", "support", "support"],
  ];

  function accountButtons() {
    if (user) {
      return `<span class="user-chip">${esc(t("welcome"))} ${esc(user)}</span><button class="btn" data-act="logout" type="button">${esc(t("logout"))}</button>`;
    }
    return `<button class="btn" data-act="login" type="button">${esc(t("login"))}</button>
      <button class="btn primary" data-act="signup" type="button">${esc(t("signup"))}</button>`;
  }

  function shell(content) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.body.innerHTML = `
      <div class="arcs" hidden aria-hidden="true"></div>
      <div class="shell">
        <header class="mast">
          <div class="mast-inner">
            <a class="brand" href="index.html" aria-label="Female MENA">${logo}</a>
            <nav class="topnav" aria-label="${esc(t("menu"))}">
              ${nav
                .filter(([href, id]) => id !== "community")
                .map(([href, id, key]) => `<a class="${page === id ? "on" : ""}" href="${href}">${esc(id === "roster" ? (lang === "en" ? "Community" : "المجتمع") : t(key))}</a>`)
                .join("")}
            </nav>
            <div class="actions">
              <button class="lang-btn" type="button" data-act="lang">${esc(t("lang"))}</button>
              ${accountButtons()}
              <button class="icon-btn menu-btn" type="button" data-act="menu" aria-label="${esc(t("menu"))}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
              </button>
            </div>
          </div>
        </header>
        <main><div class="wrap">${content}</div></main>
        ${footer()}
      </div>
      ${menuOpen ? menu() : ""}
      ${authMode ? authDialog() : ""}
      ${cookie ? "" : cookieBanner()}
    `;
    bind();
  }

  function footer() {
    return `<footer class="site-footer"><div class="wrap">
      <div class="foot-grid">
        <div>
          <a class="brand" href="index.html" aria-label="Female MENA">${logo}</a>
          <p>${esc(t("footerSlogan"))}</p>
          <div class="foot-links">
            <a href="start.html">${esc(t("start"))}</a>
            <a href="terms.html">${esc(t("terms"))}</a>
            <a href="privacy.html">${esc(t("privacy"))}</a>
            <a href="cookies.html">${esc(t("cookies"))}</a>
            <a href="support.html">${esc(t("contact"))}</a>
          </div>
        </div>
        <div>
          <div class="socials">
            <span>${esc(t("follow"))}</span>
            <a href="https://x.com/MENAHUB_" target="_blank" rel="noreferrer">X</a>
            <a href="https://www.tiktok.com/@menahub_" target="_blank" rel="noreferrer">TikTok</a>
            <a href="https://www.twitch.tv/menahub_" target="_blank" rel="noreferrer">Twitch</a>
            <a href="https://discord.com" target="_blank" rel="noreferrer">Discord</a>
          </div>
          <p><button class="motion" type="button" data-act="motion">${esc(t("motion"))}: ${esc(t(motion ? "on" : "off"))}</button></p>
        </div>
      </div>
      <div class="copy">${esc(t("rights"))}</div>
    </div></footer>`;
  }

  function menu() {
    return `<div class="overlay" data-act="menu"></div>
      <aside class="drawer" role="dialog" aria-label="${esc(t("menu"))}">
        <div class="drawer-top">
          <button class="icon-btn" type="button" data-act="menu" aria-label="${esc(t("close"))}">✕</button>
          <a class="brand" href="index.html">${logo}</a>
        </div>
        <nav>
          ${nav
            .map(
              ([href, id, key]) =>
                `<a class="${page === id ? "on" : ""} ${id === "roster" ? "new" : ""}" href="${href}">${esc(t(key))}</a>`
            )
            .join("")}
        </nav>
        <div class="drawer-bottom">
          <a href="https://x.com/MENAHUB_" target="_blank" rel="noreferrer">@MENAHUB_</a>
          <a href="https://www.tiktok.com/@menahub_" target="_blank" rel="noreferrer">TikTok</a>
          <a href="https://www.twitch.tv/menahub_" target="_blank" rel="noreferrer">Twitch</a>
        </div>
      </aside>`;
  }

  function authDialog() {
    const signup = authMode === "signup";
    return `<div class="modal" data-act="close-auth">
      <form class="dialog stack" data-auth-form="1">
        <h2>${esc(signup ? t("signup") : t("login"))}</h2>
        <p>${esc(signup ? t("noAccount") : t("haveAccount"))}</p>
        ${signup ? `<input class="field" name="name" required placeholder="${esc(t("name"))}"/>` : ""}
        <input class="field" name="email" type="email" required placeholder="${esc(t("email"))}"/>
        <input class="field" name="password" type="password" required minlength="4" placeholder="${esc(t("password"))}"/>
        <button class="btn primary" type="submit">${esc(signup ? t("signup") : t("login"))}</button>
        <button class="btn" type="button" data-act="${signup ? "login" : "signup"}">${esc(signup ? t("haveAccount") : t("noAccount"))}</button>
      </form>
    </div>`;
  }

  function cookieBanner() {
    return `<aside class="cookie" role="dialog">
      <h2>${esc(t("cookieTitle"))}</h2>
      <p>${esc(t("cookieBody"))}</p>
      <a class="gold-link" href="cookies.html">${esc(t("details"))}</a>
      <div class="row-btns">
        <button class="btn" type="button" data-act="cookie" data-choice="necessary">${esc(t("necessary"))}</button>
        <button class="btn primary" type="button" data-act="cookie" data-choice="all">${esc(t("allow"))}</button>
      </div>
    </aside>`;
  }

  function crest(text) {
    const v = esc(text || "—");
    return `<span class="crest ${String(text || "").length > 3 ? "long" : ""}" dir="ltr">${v}</span>`;
  }

  function teamRows() {
    return teams
      .map((team) => {
        const share = Math.max(0.08, team.points / maxPts);
        const zone = team.zone
          ? `<small class="zone ${team.zone === "lcq" ? "lcq" : "elite"}">${esc(tr(team.zoneLabel))}</small>`
          : "";
        const roster = team.players.length
          ? `<ul class="roster">${team.players
              .map(
                (p) =>
                  `<li><a href="players.html#${slug(p.name)}">${esc(p.name)}</a><b dir="ltr">${esc(p.points)}</b></li>`
              )
              .join("")}</ul>`
          : `<p>${esc(t("noRoster"))}</p>`;
        return `<article class="row" id="team-${slug(team.name)}">
          <div class="row-main">
            <div class="rank">${team.rank}</div>
            <div class="team">${crest(team.crest)}<div><a href="teams.html#${slug(team.name)}">${esc(team.name)}</a><small>${esc(tr(team.sub))}</small>${zone}</div></div>
            <div class="pts"><strong>${team.points}</strong><i style="--share:${share}"></i></div>
            <div class="stat">${team.titles}</div>
            <div class="stat">${team.wins}</div>
            <div class="stat">${team.losses}</div>
            <div class="stat" dir="ltr">${esc(rate(team.rate))}</div>
            <div class="diff ${team.sign === "down" ? "down" : ""}"><b dir="ltr">${esc(team.diff || "—")}</b><small>${esc(tr(team.split))}</small></div>
            <div class="form">${(team.form || []).map(mark).join("")}</div>
            <button class="chev" type="button" data-act="expand" aria-label="${esc(team.name)}"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m4 6 4 4 4-4"/></svg></button>
          </div>
          <div class="detail"><p>${esc(t("rosterTitle"))}</p>${roster}</div>
        </article>`;
      })
      .join("");
  }

  function playerRows() {
    return players
      .map((p) => {
        const share = Math.max(0.08, p.points / maxPlayer);
        const initial = esc((p.name || "?").slice(0, 1).toUpperCase());
        const img = p.avatar
          ? `<img src="${esc(p.avatar)}" alt="" onerror="this.replaceWith(document.createTextNode('${initial}'))"/>`
          : initial;
        return `<article class="row" id="${slug(p.name)}">
          <div class="row-main">
            <div class="rank">${p.rank}</div>
            <div class="team"><span class="avatar">${img}</span><div><a href="players.html#${slug(p.name)}">${esc(p.name)}</a><small>${esc(tr(p.sub))}</small></div></div>
            <div class="pts"><strong>${p.points}</strong><i style="--share:${share}"></i></div>
            <div class="stat">${p.titles}</div>
            <div class="stat"><a href="teams.html#${slug(p.team)}">${esc(p.team)}</a></div>
            <button class="chev" type="button" data-act="expand" aria-label="${esc(p.name)}"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m4 6 4 4 4-4"/></svg></button>
          </div>
          <div class="detail"><p>${esc(tr(p.best))} · ${p.events}</p></div>
        </article>`;
      })
      .join("");
  }

  function boardPage(kind) {
    const isTeams = kind === "teams";
    return `<header class="page-head">
        <h1>${esc(isTeams ? t("teamTitle") : t("playerTitle"))}</h1>
        <p class="lede">${esc(isTeams ? t("teamLede") : t("playerLede"))} <a href="rules.html">${esc(t("how"))}</a></p>
      </header>
      <div class="toolbar">
        <div class="seg">
          <a class="${isTeams ? "on" : ""}" href="leaderboards.html">${esc(t("teamsTab"))}</a>
          <a class="${isTeams ? "" : "on"}" href="players.html">${esc(t("playersTab"))}</a>
        </div>
        <span class="field-label">${esc(t("competition"))}</span>
        <select class="field" aria-label="${esc(t("competition"))}">
          <option>${esc(t("all"))}</option>
          <option>Daily Cup #1</option>
          <option>Daily Cup #2</option>
          <option>Daily Cup #3</option>
        </select>
      </div>
      ${
        isTeams
          ? `<div class="legend"><span><i class="dot elite"></i>${esc(t("elite"))}</span><span><i class="dot lcq"></i>${esc(t("lcq"))}</span></div>`
          : ""
      }
      <section class="board ${isTeams ? "" : "players"}" aria-label="${esc(isTeams ? t("teamTitle") : t("playerTitle"))}">
        <div class="board-inner">
          <div class="head">
            ${
              isTeams
                ? `<span>${esc(t("rank"))}</span><span class="start">${esc(t("team"))}</span><span>${esc(t("points"))}</span><span>${esc(t("titles"))}</span><span>${esc(t("wins"))}</span><span>${esc(t("losses"))}</span><span>${esc(t("rate"))}</span><span>${esc(t("diff"))}</span><span>${esc(t("form"))}</span><span></span>`
                : `<span>${esc(t("rank"))}</span><span class="start">${esc(t("player"))}</span><span>${esc(t("points"))}</span><span>${esc(t("titles"))}</span><span>${esc(t("currentTeam"))}</span><span></span>`
            }
          </div>
          ${isTeams ? teamRows() : playerRows()}
        </div>
      </section>
      <p class="foot-note">${esc(isTeams ? t("countTeams", teams.length) : t("countPlayers", players.length))}</p>`;
  }

  function homePage() {
    const top = teams.slice(0, 5);
    return `<section class="hero">
      <div class="panel hero-copy">
        <p class="kicker"><i>●</i> ${esc(t("heroKicker"))}</p>
        <h1>${t("heroTitle")}</h1>
        <p>${esc(t("heroText"))}</p>
        <div class="hero-actions">
          <button class="btn primary" type="button" data-act="signup">${esc(t("createAccount"))}</button>
          <a class="btn" href="tournaments.html">${esc(t("createCup"))}</a>
        </div>
      </div>
      <div class="panel">
        <p class="kicker">${esc(t("leaderboards"))} <span class="tag">${esc(t("teamsTab"))}</span></p>
        <ol class="mini-list">
          ${top
            .map(
              (team) => `<li>
              <span class="rank">${String(team.rank).padStart(2, "0")}</span>
              <span><span class="nm">${esc(team.name)}</span><br><small>${team.played} · ${esc(rate(team.rate))}</small></span>
              <span class="sc">${team.points}</span>
            </li>`
            )
            .join("")}
        </ol>
        <p><a class="gold-link" href="leaderboards.html">${esc(t("fullBoard"))}</a></p>
      </div>
    </section>
    <section class="section panel">
      <h2>${esc(t("recruitTitle"))}</h2>
      <p class="muted">${esc(t("recruitText"))}</p>
      <div class="cards">
        <article class="card"><h3>${esc(t("lookingTeams"))}</h3><p>TvD · AR</p><p>primeeesport · SMG</p></article>
        <article class="card"><h3>${esc(t("lookingPlayers"))}</h3><p>MGRALL · SMG</p><p>zenus · SMG</p></article>
        <article class="card"><a class="btn primary" href="roster.html">${esc(t("roster"))}</a></article>
      </div>
    </section>
    ${cups()}`;
  }

  const CUPS = [
    {
      id: "cup-3",
      name: "Daily Cup #3",
      ended: "4 نوفمبر 2026",
      start: "1 نوفمبر 2026",
      time: "8:00 م",
      seats: 47,
      cap: 64,
      champion: "soulmate",
      crest: "SOUL",
      foe: "X 2.0",
      foeCrest: "X",
      score: [3, 1],
      range: "1 نوفمبر 2026 – 4 نوفمبر 2026",
    },
    {
      id: "cup-2",
      name: "Daily Cup #2",
      ended: "30 أكتوبر 2026",
      start: "28 أكتوبر 2026",
      time: "8:00 م",
      seats: 51,
      cap: 64,
      champion: "Vamo",
      crest: "VAMO",
      foe: "ASTRO White",
      foeCrest: "AS",
      score: [3, 2],
      range: "28 أكتوبر 2026 – 30 أكتوبر 2026",
    },
    {
      id: "cup-1",
      name: "Daily Cup #1",
      ended: "26 أكتوبر 2026",
      start: "26 أكتوبر 2026",
      time: "6:00 م",
      seats: 39,
      cap: 64,
      champion: "Xx",
      crest: "XX",
      foe: "",
      foeCrest: "",
      score: null,
      range: "26 أكتوبر 2026",
    },
  ];

  function cupLabel(key) {
    const en = {
      ended: "Ended",
      cup: "Tournament",
      start: "Start time",
      format: "Match format",
      seats: "Seats",
      teamsWord: "teams",
      results: "Results",
      search: "Search for a tournament...",
      filter: "Filter and sort",
      all: "All",
      finished: "Finished",
      pointsHero: "ranking points for the champion",
      champion: "Tournament champion",
      prize: "Grand Final",
      watch: "View the crowning",
      overview: "Overview",
      matches: "Live matches",
      players: "Participants",
      rules: "Rules",
      stats: "Stats",
      entry: "Entry",
      size: "Team size",
      accept: "Entry approval",
      auto: "Automatic",
      system: "Competition format",
      scale: "Ranking points",
      about: "About the competition",
      closed: "Competition ended",
      ask: "Have a question or a dispute?",
      contact: "Contact support",
      back: "Tournaments",
    };
    const ar = {
      ended: "منتهية",
      cup: "بطولة",
      start: "موعد البداية",
      format: "نظام المباراة",
      seats: "المقاعد",
      teamsWord: "فريقًا",
      results: "النتائج",
      search: "ابحث عن بطولة...",
      filter: "تصفية وترتيب",
      all: "الكل",
      finished: "منتهية",
      pointsHero: "نقطة تصنيف للبطل",
      champion: "بطل البطولة",
      prize: "Grand Final",
      watch: "عرض التتويج",
      overview: "نظرة عامة",
      matches: "المباريات",
      players: "المشاركون",
      rules: "القوانين",
      stats: "الإحصائيات",
      entry: "المشاركة",
      size: "حجم الفريق",
      accept: "قبول المشاركة",
      auto: "تلقائي",
      system: "نظام المنافسة",
      scale: "نقاط التصنيف",
      about: "نبذة عن المنافسة",
      closed: "انتهت المنافسة",
      ask: "هل لديك استفسار أو اعتراض؟",
      contact: "تواصل مع الدعم",
      back: "البطولات",
    };
    return (lang === "en" ? en : ar)[key];
  }

  function faces(teamName) {
    const team = teams.find((item) => item.name === teamName);
    if (!team) return "";
    return team.players
      .slice(0, 4)
      .map((member) => {
        const person = players.find((item) => item.name === member.name);
        if (person && person.avatar) return `<img src="${esc(person.avatar)}" alt="" />`;
        return `<span>${esc(member.name.slice(0, 1))}</span>`;
      })
      .join("");
  }

  function cupCards() {
    const list = cupOrder === "new" ? CUPS : [...CUPS].reverse();
    const q = cupQuery.trim().toLowerCase();
    return list
      .filter((cup) => cupFilter === "all" || cupFilter === "ended")
      .filter((cup) => !q || cup.name.toLowerCase().includes(q))
      .map((cup) => {
        const pct = Math.round((cup.seats / cup.cap) * 100);
        return `<a class="t-card" data-cup="${esc(cup.name.toLowerCase())}" href="tournaments.html#${cup.id}">
          <div class="t-cover">
            <img src="media/card-glass.webp" alt="" />
            <img class="t-logo" src="media/mw-logo.webp" alt="" />
            <span class="t-badge done"><i></i>${esc(cupLabel("ended"))}</span>
            <span class="t-badge kind">${esc(cupLabel("cup"))}</span>
          </div>
          <div class="t-body">
            <h3>${esc(cup.name)}</h3>
            <p class="t-ended"><i></i>${lang === "en" ? "Ended" : "انتهت في"} ${esc(cup.ended)}</p>
            <div class="t-split">
              <div><span>${esc(cupLabel("start"))}</span><b>${esc(cup.start)}</b><small>${esc(cup.time)} · ${lang === "en" ? "Saudi Arabia" : "السعودية"}</small></div>
              <div><span>${esc(cupLabel("format"))}</span><b>BO3</b><small>BO5 Final</small></div>
            </div>
            <div class="t-seats">
              <span>${esc(cupLabel("seats"))}</span>
              <b><bdi dir="ltr">${cup.seats} / ${cup.cap}</bdi> ${esc(cupLabel("teamsWord"))}</b>
            </div>
            <div class="t-bar"><i style="width:${pct}%"></i></div>
            <span class="t-go">${esc(cupLabel("results"))} <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m10 4-4 4 4 4"/></svg></span>
          </div>
        </a>`;
      })
      .join("");
  }

  function cups() {
    return `<section class="section" id="community">
      <h2>${esc(t("tournaments"))}</h2>
      <div class="t-grid">${cupCards()}</div>
    </section>`;
  }

  function tournamentsPage() {
    const cup = CUPS.find((item) => location.hash === "#" + item.id);
    if (cup) return cupDetail(cup);
    const shown = CUPS.filter((item) => !cupQuery.trim() || item.name.toLowerCase().includes(cupQuery.trim().toLowerCase()));
    return `<header class="t-head">
        <div>
          <h1>${esc(t("tournaments"))}</h1>
          <p class="lede">${shown.length} ${lang === "en" ? "tournaments" : "بطولات"}</p>
        </div>
      </header>
      <div class="t-tools">
        <label class="t-search">
          <input data-cup-search value="${esc(cupQuery)}" placeholder="${esc(cupLabel("search"))}" />
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        </label>
        <div class="t-tools-row">
          <div class="t-pills">
            <button type="button" class="${cupFilter === "all" ? "on" : ""}" data-act="cup-filter" data-filter="all"><span>${esc(cupLabel("all"))}</span><b>3</b></button>
            <button type="button" class="${cupFilter === "ended" ? "on" : ""}" data-act="cup-filter" data-filter="ended"><span>${esc(cupLabel("finished"))}</span><b>3</b></button>
          </div>
          <button class="t-sort" type="button" data-act="cup-sort">${esc(cupLabel("filter"))} <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 6h16M7 12h10M10 18h4"/></svg></button>
        </div>
      </div>
      <div class="t-grid">${cupCards() || `<p class="muted">${lang === "en" ? "No tournaments match that search." : "لا توجد بطولة بهذا الاسم."}</p>`}</div>`;
  }

  function pairRound(names, scores) {
    const matches = [];
    for (let i = 0; i < names.length; i += 2) {
      const sa = scores[i / 2][0];
      const sb = scores[i / 2][1];
      matches.push({ a: names[i], b: names[i + 1], sa, sb, state: "done" });
    }
    return matches;
  }

  function advance(matches) {
    return matches.map((match) => (match.sa >= match.sb ? match.a : match.b));
  }

  function playDown(names, titles, finalScore) {
    let round = names.slice();
    const rounds = [];
    titles.forEach((title, index) => {
      const count = round.length / 2;
      const scores = [];
      for (let match = 0; match < count; match += 1) {
        if (index === titles.length - 1) scores.push(finalScore);
        else scores.push(match % 2 ? [2, 1] : [2, 0]);
      }
      const matches = pairRound(round, scores);
      rounds.push({ title, matches });
      round = advance(matches);
    });
    return rounds;
  }

  function bracketMap(cup) {
    const champ = cup.champion;
    const rival = cup.foe || "";
    const bag = teams.map((team) => team.name).filter((name) => name && name !== champ && name !== rival);
    const winnersField = [champ, ...bag.slice(0, 15)];
    const winnerRounds = playDown(winnersField, ["Winners Round 1", "Winners Round 2", "Winners Round 3", "Winners Final"], [3, 1]);
    const wfFoe = winnerRounds[3].matches[0].b;
    const losersBag = bag.filter((name) => name !== wfFoe);
    const losersLead = rival || losersBag[0];
    const losersRest = losersBag.filter((name) => name !== losersLead);
    const losersField = [losersLead, ...losersRest.slice(0, 7), wfFoe, ...losersRest.slice(7, 14)];
    const loserRounds = playDown(losersField, ["Losers Round 1", "Losers Round 2", "Losers Round 3", "Losers Final"], [3, 2]);
    const gf = cup.score
      ? [{ a: champ, b: rival, sa: cup.score[0], sb: cup.score[1], state: "done" }]
      : [{ a: champ, b: "—", sa: null, sb: null, state: "wait" }];
    return { winnerRounds, loserRounds, gf };
  }

  function bracketMatch(match) {
    const query = bracketQuery.trim().toLowerCase();
    const blob = `${match.a} ${match.b}`.toLowerCase();
    const hit = query && blob.includes(query);
    const dim = (query && !hit) || (bracketStatus === "wait" && match.state !== "wait") || (bracketStatus === "live" && match.state !== "live");
    const pending = match.state === "wait";
    const topWin = !pending && match.sa > match.sb;
    const botWin = !pending && match.sb > match.sa;
    const score = (n) => (n == null ? "" : `<span>${n}</span>`);
    return `<article class="br-match${hit ? " hit" : ""}${dim ? " dim" : ""}${pending ? " pending" : ""}" data-teams="${esc(blob)}">
      <div class="${topWin ? "win" : "loss"}"><b>${esc(match.a)}</b>${score(match.sa)}</div>
      <div class="${botWin ? "win" : "loss"}"><b>${esc(match.b)}</b>${score(match.sb)}</div>
    </article>`;
  }

  function bracketColumn(title, matches, feed, side) {
    const pairs = [];
    for (let i = 0; i < matches.length; i += 2) pairs.push(matches.slice(i, i + 2));
    if (!pairs.length) pairs.push(matches);
    return `<section class="br-col ${feed}" data-side="${side}">
      <p class="br-label">${esc(title)}</p>
      <div class="br-pairs">
        ${pairs
          .map((pair) => `<div class="br-pair ${pair.length === 2 ? "linked" : "solo"}">${pair.map(bracketMatch).join("")}</div>`)
          .join("")}
      </div>
    </section>`;
  }

  function bracketPanel(cup) {
    const map = bracketMap(cup);
    const showW = bracketSide !== "losers";
    const showL = bracketSide !== "winners";
    const gf = map.gf[0];
    const gfCard = `<section class="br-col br-mid" data-side="final">
      <p class="br-label">Grand Final</p>
      <div class="br-pairs"><div class="br-pair solo gf-slot">
        <div class="br-final">
          <div class="br-trophy" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 4h8v3a4 4 0 0 1-8 0V4z"/><path d="M8 5H5.5A2.5 2.5 0 0 0 8 10"/><path d="M16 5h2.5A2.5 2.5 0 0 1 16 10"/><path d="M12 11v2"/><path d="M9 17h6"/><path d="M10 13h4l.8 4H9.2L10 13z"/></svg></div>
          <p>Final</p>
          ${bracketMatch(gf)}
        </div>
      </div></div>
    </section>`;
    const winnerCols = showW
      ? [...map.winnerRounds].reverse().map((round) => bracketColumn(round.title, round.matches, "feed-left", "winners"))
      : [];
    const loserCols = showL ? map.loserRounds.map((round) => bracketColumn(round.title, round.matches, "feed-right", "losers")) : [];
    const scoreTxt = cup.score ? `${cup.score[0]}–${cup.score[1]}` : "";
    const waiting = map.gf[0].state === "wait" ? 1 : 0;
    return `<div class="bracket-wrap${bracketFull ? " full" : ""}" id="bracket-map">
      <div class="br-tools">
        <label class="br-search">
          <input data-bracket-search value="${esc(bracketQuery)}" placeholder="${lang === "en" ? "Track a team" : "تتبع فريق"}" />
        </label>
        <select data-bracket-side>
          <option value="all"${bracketSide === "all" ? " selected" : ""}>${lang === "en" ? "All" : "الكل"}</option>
          <option value="winners"${bracketSide === "winners" ? " selected" : ""}>Winners</option>
          <option value="losers"${bracketSide === "losers" ? " selected" : ""}>Losers</option>
        </select>
        <span class="br-chip"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M8 4h8v3a4 4 0 0 1-8 0V4z"/><path d="M12 11v2M9 17h6"/></svg> ${esc(cup.champion)} ${scoreTxt ? `<bdi dir="ltr">${scoreTxt}</bdi>` : ""} <small>${lang === "en" ? "Champion" : "البطل"}</small></span>
        <div class="br-pills">
          <button type="button" class="${bracketStatus === "live" ? "on" : ""}" data-act="bracket-status" data-status="live">${lang === "en" ? "Live now" : "ستلعب الآن"}</button>
          <button type="button" class="${bracketStatus === "wait" ? "on" : ""}" data-act="bracket-status" data-status="wait">${lang === "en" ? "Not played" : "لم تلعب بعد"} <b>${waiting}</b></button>
        </div>
        <div class="br-zoom">
          <button type="button" data-act="bracket-zoom" data-z="out" aria-label="${lang === "en" ? "Zoom out" : "تصغير"}">−</button>
          <button type="button" data-act="bracket-zoom" data-z="in" aria-label="${lang === "en" ? "Zoom in" : "تكبير"}">+</button>
          <button type="button" data-act="bracket-full">${bracketFull ? (lang === "en" ? "Close" : "إغلاق") : lang === "en" ? "Full screen" : "ملء الشاشة"}</button>
        </div>
      </div>
      ${bracketStatus === "live" ? `<p class="br-empty">${lang === "en" ? "No match is live in this cup." : "لا توجد مباراة تُلعب الآن في هذه البطولة."}</p>` : ""}
      <div class="br-scroll">
        <div class="br-map" style="--br:${bracketZoom}">
          ${loserCols.join("")}
          ${gfCard}
          ${winnerCols.join("")}
        </div>
      </div>
    </div>`;
  }

  function cupDetail(cup) {
    const points = [
      [400, lang === "en" ? "Champion" : "البطل"],
      [300, lang === "en" ? "Finalist" : "الوصيف"],
      [260, lang === "en" ? "Third" : "الثالث"],
      [240, lang === "en" ? "Fourth" : "الرابع"],
      [180, lang === "en" ? "Top 8" : "أفضل 8"],
      [120, lang === "en" ? "Top 16" : "أفضل 16"],
      [40, lang === "en" ? "Top 32" : "أفضل 32"],
      [20, lang === "en" ? "Entry" : "المشاركة"],
    ];
    const tabs = [
      ["overview", cupLabel("overview")],
      ["format", "Double Elimination"],
      ["matches", cupLabel("matches")],
      ["roster", cupLabel("players")],
      ["rules", cupLabel("rules")],
      ["stats", cupLabel("stats")],
    ];
    const pct = Math.round((cup.seats / cup.cap) * 100);
    const formatCopy =
      lang === "en"
        ? `<p>Double elimination. Grand Final is best of 5. Winners Final and Losers Final are best of 5. Earlier rounds are BO3, and the first losers matches are one map.</p><p>Map veto: each team protects maps, and the remaining maps are picked in turn.</p>`
        : `<p>خروج مزدوج. نهائي البطولة أفضل من 5 جولات. نهائي الفائزين ونهائي الخاسرين أفضل من 5 جولات. الأدوار الأولى BO3، ومباريات الخاسر الأولى خريطة واحدة.</p><p>Map Veto: كل فريق يحمي خرائطه، وبقية الخرائط تُختار بالتبادل. لا يُسمح باختيار الأسلوب.</p>`;
    let panel = "";
    if (cupTab === "format") panel = bracketPanel(cup);
    else if (cupTab === "rules") panel = `<div class="cup-copy">${formatCopy}</div>`;
    else if (cupTab === "matches")
      panel = `<article class="final-card">
        <p class="kicker">${esc(cupLabel("prize"))}</p>
        ${
          cup.score
            ? `<div class="series">
          <div><span class="crest">${esc(cup.crest)}</span><b>${esc(cup.champion)}</b></div>
          <strong dir="ltr">${cup.score[0]} – ${cup.score[1]}</strong>
          <div><b>${esc(cup.foe)}</b><span class="crest">${esc(cup.foeCrest)}</span></div>
        </div>`
            : `<p>${esc(cup.champion)}</p>`
        }
        <p class="muted">BO5 Final</p>
        <p><a class="gold-link" href="matches.html">${esc(t("matches"))}</a></p>
      </article>`;
    else if (cupTab === "roster")
      panel = `<div class="cup-copy"><p>${cup.seats} / ${cup.cap} ${esc(cupLabel("teamsWord"))}</p><h3>${esc(cup.champion)}</h3><div class="faces lg">${faces(cup.champion)}</div></div>`;
    else if (cupTab === "stats")
      panel = `<div class="point-row">${points
        .map(([n, name]) => `<div><b>${n}</b><span>${esc(name)}</span></div>`)
        .join("")}</div>`;
    else
      panel = `<div class="cup-overview">
        <div class="cup-cols">
          <article class="card">
            <h3>${esc(cupLabel("entry"))}</h3>
            <p><span>${esc(cupLabel("size"))}</span><b>${lang === "en" ? "4–5 players" : "4–5 لاعبين"}</b></p>
            <p><span>${esc(cupLabel("accept"))}</span><b>${esc(cupLabel("auto"))}</b></p>
          </article>
          <article class="card">
            <h3>${esc(cupLabel("system"))}</h3>
            <p class="kicker">Double Elimination</p>
            ${formatCopy}
          </article>
        </div>
        <h3 class="scale-title">${esc(cupLabel("scale"))}</h3>
        <div class="point-row">${points
          .map(([n, name]) => `<div class="${n === 400 ? "hi" : ""}"><b>${n}</b><span>${esc(name)}</span></div>`)
          .join("")}</div>
        <article class="card about">
          <h3>${esc(cupLabel("about"))}</h3>
          <p class="muted">${
            lang === "en"
              ? "An official 4v4 Modern Warfare daily cup. Placement points are added to the Female MENA ranking when the event ends."
              : "بطولة يومية رسمية بأسلوب 4 ضد 4 على Modern Warfare. تُضاف نقاط المركز إلى تصنيف Female MENA بعد انتهاء البطولة."
          }</p>
        </article>
        <p class="cup-closed"><i></i> ${esc(cupLabel("closed"))} <b>${esc(cup.range)}</b></p>
        <p class="muted">${esc(cupLabel("ask"))} <a class="gold-link" href="support.html">${esc(cupLabel("contact"))}</a></p>
      </div>`;
    return `<div class="cup-page" id="${cup.id}">
      <p class="crumb"><a href="tournaments.html">${esc(cupLabel("back"))}</a> <span>/</span> ${esc(cup.name)}</p>
      <section class="cup-hero${cupTab === "format" ? " is-hidden" : ""}">
        <img class="cup-hero-bg" src="media/card-glass.webp" alt="" />
        <div class="cup-hero-shade"></div>
        <img class="cup-hero-logo" src="media/mw-logo.webp" alt="" />
        <div class="cup-hero-copy">
          <div class="t-badge-row">
            <span class="t-badge done"><i></i>${esc(cupLabel("ended"))}</span>
            <span class="t-badge kind">${esc(cupLabel("cup"))}</span>
          </div>
          <h1>${esc(cup.name)}</h1>
          <div class="hero-facts">
            <div><span>${esc(cupLabel("start"))}</span><b>${esc(cup.start)}</b><small>${esc(cup.time)} · ${lang === "en" ? "Saudi Arabia" : "السعودية"}</small></div>
            <div><span>${esc(cupLabel("seats"))}</span><b dir="ltr">${cup.seats} / ${cup.cap}</b><div class="t-bar"><i style="width:${pct}%"></i></div></div>
            <div><span>${lang === "en" ? "Points" : "النقاط"}</span><b>400</b><small>${esc(cupLabel("pointsHero"))}</small></div>
          </div>
        </div>
      </section>
      <div class="cup-layout">
        <aside class="champ">
          <p class="kicker">${esc(cupLabel("champion"))}</p>
          <h2>${esc(cup.champion)}</h2>
          <span class="crest lg">${esc(cup.crest)}</span>
          <p class="muted">${esc(cup.name)}</p>
          <div class="faces">${faces(cup.champion)}</div>
          <p class="kicker">${esc(cupLabel("prize"))}</p>
          ${
            cup.score
              ? `<div class="series compact">
            <span>${esc(cup.champion)}</span>
            <strong dir="ltr">${cup.score[0]} – ${cup.score[1]}</strong>
            <span>${esc(cup.foe)}</span>
          </div>`
              : ""
          }
          <button class="btn primary block" type="button" data-act="cup-tab" data-tab="matches">${esc(cupLabel("watch"))}</button>
        </aside>
        <div>
          <div class="cup-tabs">
            ${tabs
              .map(
                ([id, label]) =>
                  `<button type="button" class="${cupTab === id ? "on" : ""}" data-act="cup-tab" data-tab="${id}">${esc(label)}</button>`
              )
              .join("")}
          </div>
          ${panel}
        </div>
      </div>
    </div>`;
  }

  function rulesPage() {
    const rows = [
      ["البطل", "Champion", 400, 100, 80],
      ["الوصيف", "Runner-up", 300, 75, 60],
      ["الثالث", "Third", 260, 65, 52],
      ["الرابع", "Fourth", 240, 60, 48],
      ["أفضل 8 (5–8)", "Top 8 (5–8)", 180, 45, 36],
      ["أفضل 16 (9–16)", "Top 16 (9–16)", 120, 30, 24],
      ["أفضل 32 (17–32)", "Top 32 (17–32)", 40, 10, 8],
      ["المشاركة (33 فما دون)", "Participation (33+)", 20, 5, 4],
    ];
    const place = lang === "en" ? "Place" : "المركز";
    const tp = lang === "en" ? "Team points" : "نقاط الفريق";
    const p4 = lang === "en" ? "Each of 4" : "لكل لاعب من 4";
    const p5 = lang === "en" ? "Each of 5" : "لكل لاعب من 5";
    return `<header class="page-head rules"><h1>${lang === "en" ? "Ranking points" : "نظام نقاط التصنيف"}</h1>
      <p class="lede">${lang === "en" ? "Based on the official Call of Duty qualifier points: a team earns its placement points, then those points are split across its players." : "مبني على نظام نقاط بطولات كول أوف ديوتي التأهيلية: يحصل الفريق على نقاط مركزه، وتُقسم على لاعبيه."}</p></header>
      <div class="rules"><table>
        <thead><tr><th>${place}</th><th>${tp}</th><th>${p4}</th><th>${p5}</th></tr></thead>
        <tbody>${rows
          .map(
            (r) =>
              `<tr><td>${esc(lang === "en" ? r[1] : r[0])}</td><td class="num">${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td></tr>`
          )
          .join("")}</tbody>
      </table></div>
      <div class="prose">
        <article class="card"><h2>${lang === "en" ? "Splitting points" : "تقسيم النقاط"}</h2><ul>
          <li>${lang === "en" ? "Team points are split equally across players who took part." : "تُقسم نقاط الفريق بالتساوي على لاعبيه الذين شاركوا في البطولة."}</li>
          <li>${lang === "en" ? "A participant played at least one map. If stats were not recorded for four players, the final roster counts." : "المشارك هو من لعب خريطة واحدة على الأقل. وإذا لم تُسجَّل الإحصائيات فأربعة لاعبين على الأقل، تُحسب التشكيلة النهائية."}</li>
          <li>${lang === "en" ? "Teams that share a placement each receive that placement's full points." : "الفرق التي تتشارك مركزًا تحصل كل منها على نقاط ذلك المركز كاملة."}</li>
        </ul></article>
        <article class="card"><h2>${lang === "en" ? "Player moves" : "انتقال اللاعبين"}</h2><ul>
          <li>${lang === "en" ? "Points belong to the player and move with them." : "نقاط اللاعب ملكه وتنتقل معه إذا غيّر فريقه."}</li>
          <li>${lang === "en" ? "A team's ranking points are the sum of its current players." : "نقاط الفريق في التصنيف هي مجموع نقاط لاعبيه الحاليين."}</li>
          <li>${lang === "en" ? "Match history stays with the team. If a team disbands, players keep their points." : "يبقى سجل الفريق من بطولات وألقاب للفريق نفسه. وإذا حُلّ الفريق بقيت نقاط لاعبيه معهم."}</li>
        </ul></article>
        <article class="card wide"><h2>${lang === "en" ? "Example" : "مثال"}</h2>
          <p class="muted">${lang === "en" ? "A 4-player team wins: 400 ÷ 4 = 100 points each, and the team has 400. If one player moves, the old team drops to 300 and the new team gains 100." : "فاز فريق من 4 لاعبين بالبطولة: 400 ÷ 4 = 100 نقطة لكل لاعب، ونقاط الفريق 400. إذا انتقل أحد لاعبيه، تصبح نقاط الفريق الأول 300 وتزيد نقاط الفريق الجديد 100."}</p>
        </article>
      </div>`;
  }

  function teamsPage() {
    return `<header class="page-head"><h1>${esc(t("teams"))}</h1><p class="lede">${esc(t("teamLede"))}</p></header>
      <div class="cards">${teams
        .map(
          (team) => `<article class="card" id="${slug(team.name)}">
          <p class="kicker">#${team.rank}</p>
          <h3>${crest(team.crest)} ${esc(team.name)}</h3>
          <p>${esc(tr(team.sub))}</p>
          <p class="num" style="color:var(--accent);font-family:Manrope,sans-serif;font-weight:800;font-size:28px">${team.points}</p>
          <p>${(team.players || []).map((p) => esc(p.name)).join(" · ") || esc(t("noRoster"))}</p>
          <a class="gold-link" href="leaderboards.html#team-${slug(team.name)}">${esc(t("leaderboards"))}</a>
        </article>`
        )
        .join("")}</div>`;
  }

  const LIVE_MATCHES = [
    {
      id: "xx-astro",
      live: true,
      cup: "Daily Cup #3",
      round: "#12 Winners Round 2",
      format: "BO3",
      note: "أول مباراة له بالبطولة",
      a: { name: "Xx", tag: "XX", role: "محور الفريق في البطولة", players: ["eclw", "Mishary", "Nero1", "RWZ"] },
      b: { name: "ASTRO White", tag: "AS", role: "محور الفريق في البطولة", players: ["fahad1", "Hakari", "Lenfield", "MURD3R"] },
      score: [1, 0],
      maps: [
        { name: "Rooftops", score: "6 – 4", side: "a", state: "done" },
        { name: "Reactor U92", score: "4 – 3", side: "live", state: "live" },
        { name: "Lithium", score: "—", side: "", state: "wait" },
      ],
    },
    {
      id: "tgoz-sunshine",
      live: false,
      cup: "Daily Cup #3",
      round: "#8 Winners Round 1",
      format: "BO3",
      note: "أول مباراة له بالبطولة",
      a: { name: "TGozteam", tag: "TRKY", role: "محور الفريق في البطولة", players: ["XLaGDaV25959551", "IBRA99238075", "evilsbadr7980301", "SALEH73818605", "Digsly12893477"] },
      b: { name: "Sunshine", tag: "SURKN", role: "محور الفريق في البطولة", players: ["AclaRoca", "Shinobi", "Koushini", "abu_amwl"] },
      score: [2, 0],
      maps: [
        { name: "Rooftops", score: "6 – 2", side: "a", state: "done" },
        { name: "Reactor U92", score: "6 – 3", side: "a", state: "done" },
        { name: "Lithium", score: "—", side: "", state: "wait" },
      ],
    },
  ];

  function rosterLines(side) {
    return side.players
      .map((name, index) => {
        const person = players.find((item) => item.name === name);
        const face = person && person.avatar ? `<img src="${esc(person.avatar)}" alt="" />` : `<span>${esc(name.slice(0, 1))}</span>`;
        return `<li><i class="dot-role r${index % 5}"></i>${face}<div><b>${esc(name)}</b><small>${esc(side.tag)}</small></div></li>`;
      })
      .join("");
  }

  function matchSide(side, note) {
    return `<section class="m-side">
      <header>
        <span class="crest ${side.tag.length > 3 ? "long" : ""}">${esc(side.tag)}</span>
        <div><h2>${esc(side.name)}</h2><p>${side.players.length} ${lang === "en" ? "players" : "لاعبين"} · ${esc(side.tag)}</p></div>
      </header>
      <p class="m-role">${lang === "en" ? "Team anchor for this cup" : esc(side.role)}<br><small>${lang === "en" ? "First match in this cup" : esc(note)}</small></p>
      <ul class="m-roster">${rosterLines(side)}</ul>
    </section>`;
  }

  function matchDetail(match) {
    const status = match.live
      ? `<span class="t-badge live"><i></i>${lang === "en" ? "Live" : "مباشر"}</span>`
      : `<span class="t-badge done"><i></i>${lang === "en" ? "Finished" : "منتهية"}</span>`;
    return `<div class="match-page">
      <p class="crumb"><a href="tournaments.html#cup-3">${esc(t("tournaments"))}</a> <span>/</span> <a href="matches.html">${lang === "en" ? "Matches" : "المباريات"}</a> <span>/</span> ${esc(match.a.name)} ضد ${esc(match.b.name)}</p>
      <p><a class="gold-link" href="matches.html">${lang === "en" ? "Back to matches" : "العودة إلى المباريات"}</a></p>
      <article class="m-board" dir="ltr">
        <header class="m-top">
          <div><b>${esc(match.cup)}</b> <span>${esc(match.round)}</span></div>
          ${status}
        </header>
        <div class="m-scoreline">
          ${matchSide(match.a, match.note)}
          <div class="m-center">
            <span>${esc(match.format)}</span>
            <strong>${match.score[0]} – ${match.score[1]}</strong>
            <small>${match.live ? (lang === "en" ? "Series in progress" : "السلسلة جارية") : lang === "en" ? "Series win" : "الفوز للبطولة"}</small>
          </div>
          ${matchSide(match.b, match.note)}
        </div>
      </article>
      <div class="m-grid" dir="ltr">
        <section class="card m-chat" dir="rtl">
          <h3>${lang === "en" ? "Match chat" : "محادثة المباراة"}</h3>
          <ul>
            <li><b>النظام</b><span>${lang === "en" ? "Both teams are checked in." : "تم تأكيد حضور الفريقين."}</span></li>
            <li><b>النظام</b><span>${lang === "en" ? "Map veto is complete." : "اكتمل اختيار الخرائط."}</span></li>
            <li><b>${esc(match.a.name)}</b><span>${lang === "en" ? "Ready." : "جاهزين."}</span></li>
          </ul>
        </section>
        <section class="card" dir="rtl">
          <h3>${lang === "en" ? "Map veto" : "اختيار الخرائط"}</h3>
          <p class="muted">${lang === "en" ? "Veto finished" : "اكتمل اختيار الخرائط"}</p>
          <ol class="veto">${match.maps
            .map(
              (map, index) =>
                `<li><span>0${index + 1}</span><b>${esc(map.name)}</b><small>${map.state === "live" ? (lang === "en" ? "Live" : "الآن") : map.state === "done" ? esc(map.score) : lang === "en" ? "Decider" : "فاصل"}</small></li>`
            )
            .join("")}</ol>
        </section>
        <section class="card" dir="rtl">
          <h3>${lang === "en" ? "Match maps" : "خرائط المباراة"}</h3>
          <div class="map-cards">${match.maps
            .map(
              (map) => `<article class="map-card ${map.state}">
              <div class="map-art ${esc(map.name.split(" ")[0].toLowerCase())}"></div>
              <div><b>${esc(map.name)}</b><span>${map.state === "wait" ? "—" : esc(map.score)}</span></div>
            </article>`
            )
            .join("")}</div>
        </section>
      </div>
    </div>`;
  }

  function matchesPage() {
    const current = LIVE_MATCHES.find((item) => location.hash === "#" + item.id);
    if (current) return matchDetail(current);
    return `<header class="t-head">
      <h1>${esc(t("matches"))}</h1>
      <p class="lede">${lang === "en" ? "Series in progress and finished matches from the daily cups." : "السلاسل الجارية والمباريات المنتهية من الكؤوس اليومية."}</p>
    </header>
    <div class="m-list">${LIVE_MATCHES.map(
      (match) => `<a class="m-row" href="matches.html#${match.id}">
        <span class="t-badge ${match.live ? "live" : "done"}"><i></i>${match.live ? (lang === "en" ? "Live" : "مباشر") : lang === "en" ? "Finished" : "منتهية"}</span>
        <b>${esc(match.a.name)}</b>
        <strong dir="ltr">${match.score[0]} – ${match.score[1]}</strong>
        <b>${esc(match.b.name)}</b>
        <small>${esc(match.cup)} · ${esc(match.round)} · ${esc(match.format)}</small>
      </a>`
    ).join("")}</div>`;
  }

  function simple(title, body) {
    return `<header class="page-head"><h1>${esc(title)}</h1></header><article class="card">${body}</article>`;
  }

  function pageContent() {
    if (page === "home") return homePage();
    if (page === "leaderboards") return boardPage("teams");
    if (page === "players") return boardPage("players");
    if (page === "rules") return rulesPage();
    if (page === "tournaments") return tournamentsPage();
    if (page === "matches") return matchesPage();
    if (page === "leagues")
      return simple(t("leagues"), `<p class="muted">${esc(t("emptyLeagues"))}</p>`);
    if (page === "teams") return teamsPage();
    if (page === "partners")
      return simple(t("partners"), `<p class="muted">${lang === "en" ? "Partner placements for the Female MENA season appear in this space." : "مساحات شركاء موسم Female MENA تظهر في هذه الصفحة."}</p>`);
    if (page === "support")
      return `<header class="page-head"><h1>${esc(t("support"))}</h1></header>
        <form class="card stack" data-support="1">
          <input class="field" name="name" required placeholder="${esc(t("name"))}"/>
          <input class="field" type="email" name="email" required placeholder="${esc(t("email"))}"/>
          <textarea class="field" name="message" required placeholder="${esc(t("message"))}"></textarea>
          <button class="btn primary" type="submit">${esc(t("send"))}</button>
          <p class="muted hidden" data-sent="1">${esc(t("sent"))}</p>
        </form>`;
    if (page === "roster")
      return `<header class="page-head"><h1>${esc(t("recruitTitle"))}</h1><p class="lede">${esc(t("recruitText"))}</p></header>
        <div class="cards">
          <article class="card"><h3>TvD</h3><p>${lang === "en" ? "Looking for AR · 6 days ago" : "يبحث عن AR · قبل 6 أيام"}</p></article>
          <article class="card"><h3>primeeesport</h3><p>${lang === "en" ? "Looking for an SMG player" : "يبحث عن لاعب SMG"}</p></article>
          <article class="card"><h3>MGRALL</h3><p>SMG · ${lang === "en" ? "available" : "متاح"}</p></article>
          <article class="card"><h3>zenus</h3><p>SMG · ${lang === "en" ? "available" : "متاح"}</p></article>
        </div>`;
    if (page === "start")
      return simple(
        t("start"),
        `<ol><li>${lang === "en" ? "Create an account." : "أنشئ حسابًا."}</li><li>${lang === "en" ? "Join or create a team." : "انضم إلى فريق أو أنشئ فريقك."}</li><li>${lang === "en" ? "Enter an official cup. Points land on the leaderboard when the event ends." : "شارك في كأس رسمي. تُحتسب النقاط في التصنيف بعد انتهاء البطولة."}</li></ol>`
      );
    if (page === "terms")
      return simple(t("terms"), `<p class="muted">${lang === "en" ? "Play fair, use your own account, and follow the tournament rules published for each cup. Rankings only include finished official events." : "العب بنزاهة، واستخدم حسابك، والتزم بقواعد كل بطولة. التصنيف يضم البطولات الرسمية المنتهية فقط."}</p>`);
    if (page === "privacy")
      return simple(t("privacy"), `<p class="muted">${esc(t("cookieBody"))}</p>`);
    if (page === "cookies")
      return simple(t("cookies"), `<p class="muted">${esc(t("cookieBody"))}</p>`);
    return homePage();
  }

  function bind() {
    document.body.querySelectorAll("[data-act]").forEach((el) => {
      el.addEventListener("click", (event) => {
        const act = el.dataset.act;
        if (act !== "close-auth") event.stopPropagation();
        if (act === "menu") {
          menuOpen = !menuOpen;
          render();
        } else if (act === "lang") {
          lang = lang === "ar" ? "en" : "ar";
          localStorage.setItem("mh-lang", lang);
          render();
        } else if (act === "login" || act === "signup") {
          event.preventDefault();
          authMode = act;
          render();
        } else if (act === "close-auth") {
          if (event.target === el) {
            authMode = null;
            render();
          }
        } else if (act === "logout") {
          user = "";
          localStorage.removeItem("mh-user");
          render();
        } else if (act === "cookie") {
          cookie = el.dataset.choice;
          localStorage.setItem("mh-cookie", cookie);
          render();
        } else if (act === "motion") {
          motion = !motion;
          localStorage.setItem("mh-motion", motion ? "on" : "off");
          render();
        } else if (act === "expand") {
          el.closest(".row").classList.toggle("open");
        } else if (act === "cup-filter") {
          cupFilter = el.dataset.filter;
          render();
          return;
        } else if (act === "cup-sort") {
          cupOrder = cupOrder === "new" ? "old" : "new";
          render();
          return;
        } else if (act === "cup-tab") {
          cupTab = el.dataset.tab || "overview";
          if (cupTab !== "format") bracketFull = false;
          render();
          return;
        } else if (act === "bracket-zoom") {
          const step = el.dataset.z === "in" ? 0.12 : -0.12;
          bracketZoom = Math.min(1.4, Math.max(0.72, Math.round((bracketZoom + step) * 100) / 100));
          render();
          return;
        } else if (act === "bracket-full") {
          bracketFull = !bracketFull;
          render();
          return;
        } else if (act === "bracket-status") {
          bracketStatus = bracketStatus === el.dataset.status ? "all" : el.dataset.status;
          render();
          return;
        }
      });
    });
    const form = document.querySelector("[data-auth-form]");
    if (form) {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = new FormData(form);
        user = data.get("name") || String(data.get("email") || "").split("@")[0] || "Player";
        localStorage.setItem("mh-user", user);
        authMode = null;
        render();
      });
    }
    const support = document.querySelector("[data-support]");
    if (support) {
      support.addEventListener("submit", (event) => {
        event.preventDefault();
        support.querySelector("[data-sent]").classList.remove("hidden");
        support.reset();
      });
    }
    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape" && (menuOpen || authMode || bracketFull)) {
          menuOpen = false;
          authMode = null;
          bracketFull = false;
          render();
        }
      },
      { once: true }
    );
    const bracketSearch = document.querySelector("[data-bracket-search]");
    if (bracketSearch) {
      bracketSearch.addEventListener("input", () => {
        bracketQuery = bracketSearch.value;
        const q = bracketQuery.trim().toLowerCase();
        document.querySelectorAll(".br-match").forEach((card) => {
          const blob = card.dataset.teams || "";
          const off =
            (bracketStatus === "wait" && !card.classList.contains("pending")) || bracketStatus === "live";
          card.classList.toggle("hit", Boolean(q && blob.includes(q)));
          card.classList.toggle("dim", Boolean(off || (q && !blob.includes(q))));
        });
      });
    }
    const scroller = document.querySelector(".br-scroll");
    const mid = document.querySelector(".br-mid");
    if (scroller && mid) {
      const place = () => {
        const left = mid.getBoundingClientRect().left - scroller.getBoundingClientRect().left + scroller.scrollLeft;
        scroller.scrollLeft = left - (scroller.clientWidth - mid.offsetWidth) / 2;
      };
      place();
      requestAnimationFrame(place);
    }
    const bracketSidePick = document.querySelector("[data-bracket-side]");
    if (bracketSidePick) {
      bracketSidePick.addEventListener("change", () => {
        bracketSide = bracketSidePick.value;
        render();
      });
    }
    const search = document.querySelector("[data-cup-search]");
    if (search) {
      search.addEventListener("input", () => {
        cupQuery = search.value;
        const q = cupQuery.trim().toLowerCase();
        document.querySelectorAll("[data-cup]").forEach((card) => {
          card.hidden = q && !card.dataset.cup.includes(q);
        });
        const count = document.querySelector(".t-head .lede");
        if (count) {
          const n = [...document.querySelectorAll("[data-cup]")].filter((card) => !card.hidden).length;
          count.textContent = `${n} ${lang === "en" ? "tournaments" : "بطولات"}`;
        }
      });
    }
    if (location.hash && !location.hash.startsWith("#cup-")) {
      const id = decodeURIComponent(location.hash.slice(1));
      const target = document.getElementById(id);
      if (target) {
        target.classList.add("open");
        target.scrollIntoView({ block: "center" });
      }
    }
  }

  function render() {
    shell(pageContent());
  }

  window.addEventListener("hashchange", () => {
    cupTab = "overview";
    if (page === "tournaments") render();
  });

  render();
})();
