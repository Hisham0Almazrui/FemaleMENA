(() => {
  const ROLES = {
    owner: ["users.manage", "roles.manage", "analytics.view", "settings.manage", "sponsors.manage", "database.view", "logs.view", "tournaments.approve", "tournaments.manage", "matches.manage", "teams.manage", "registrations.approve", "results.update", "brackets.manage", "announcements.manage", "chat.moderate", "stats.view", "tournaments.view", "matches.view", "standings.view", "tournaments.join", "team.own", "profile.edit", "notifications.view", "history.view"],
    admin: ["tournaments.manage", "matches.manage", "teams.manage", "registrations.approve", "results.update", "brackets.manage", "announcements.manage", "chat.moderate", "stats.view", "tournaments.view", "matches.view", "standings.view", "tournaments.join", "team.own", "profile.edit", "notifications.view", "history.view"],
    visitor: ["tournaments.view", "matches.view", "standings.view", "tournaments.join", "team.own", "profile.edit", "notifications.view", "history.view"],
  };
  const RANKS = { owner: 100, admin: 50, visitor: 10 };
  let pack = null;

  function bytesToHex(buffer) {
    return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  async function digest(password, salt) {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: 120000, hash: "SHA-256" },
      key,
      256
    );
    return bytesToHex(bits);
  }

  function extras() {
    try {
      const saved = JSON.parse(localStorage.getItem("mh-published-accounts") || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  async function ready() {
    if (pack) return pack;
    const res = await fetch("data/published.json", { cache: "no-store" });
    pack = await res.json();
    pack.accounts = (pack.accounts || []).concat(extras());
    pack.tournaments = pack.tournaments || [];
    return pack;
  }

  function sessionEmail() {
    const token = localStorage.getItem("mh-token") || "";
    return token.startsWith("pub:") ? token.slice(4) : "";
  }

  function publicUser(account) {
    return {
      id: account.id,
      email: account.email,
      name: account.name,
      role: account.role,
      rank: RANKS[account.role] || 10,
      status: "active",
      permissions: ROLES[account.role] || ROLES.visitor,
    };
  }

  async function accountFromToken() {
    const email = sessionEmail();
    if (!email) return null;
    const data = await ready();
    return data.accounts.find((account) => account.email === email) || null;
  }

  function result(status, body) {
    return { ok: status < 400, status, ...body };
  }

  function cupStore() {
    try {
      const saved = JSON.parse(localStorage.getItem("mh-cup-store") || "{}");
      return {
        deleted: Array.isArray(saved.deleted) ? saved.deleted.map(String) : [],
        rows: saved.rows && typeof saved.rows === "object" ? saved.rows : {},
      };
    } catch {
      return { deleted: [], rows: {} };
    }
  }

  function remember(store) {
    try {
    const compact = {
      deleted: store.deleted,
      rows: Object.fromEntries(
        Object.entries(store.rows).map(([id, row]) => {
          const copy = { ...row };
          if (String(copy.details || "").length > 400000) copy.details = "{}";
          return [id, copy];
        })
      ),
    };
    localStorage.setItem("mh-cup-store", JSON.stringify(compact));
    return true;
  } catch {
    return false;
  }
  }

  function merged(data) {
    const store = cupStore();
    const byId = new Map();
    (data.tournaments || []).forEach((row) => byId.set(String(row.id), row));
    Object.entries(store.rows).forEach(([id, row]) => byId.set(String(id), row));
    store.deleted.forEach((id) => byId.delete(String(id)));
    return [...byId.values()];
  }

  function publicRows(rows) {
    return rows.filter((row) => {
      if (row.status === "rejected") return false;
      let details = {};
      try {
        details = JSON.parse(row.details || "{}");
      } catch {
        details = {};
      }
      return details.visibility !== "private";
    });
  }

  function rowFrom(body, previous, id) {
    const prev = previous || {};
    let details = {};
    try {
      details = JSON.parse(prev.details || "{}");
    } catch {
      details = {};
    }
    const copy = { ...details, ...(body.details || {}) };
    delete copy.logoData;
    delete copy.logoUrl;
    delete copy.logoName;
    ["card", "banner"].forEach((key) => {
      const data = copy[key + "Data"];
      if (typeof data === "string" && data.startsWith("data:image/")) copy[key + "Url"] = data;
      delete copy[key + "Data"];
    });
    const allowed = new Set(["draft", "pending", "open", "live", "ended"]);
    const stage = Array.isArray(copy.stages) ? copy.stages[0] || null : prev.stage || null;
    return {
      id,
      game: body.game === "valorant" ? "valorant" : body.game === "cod" ? "cod" : prev.game || "cod",
      name: body.name ? String(body.name).trim().slice(0, 80) : prev.name || "",
      status: allowed.has(body.status) ? body.status : prev.status || "draft",
      summary: body.summary != null ? String(body.summary).slice(0, 240) : prev.summary || "",
      start_at: body.startAt != null ? body.startAt : prev.start_at || "",
      end_at: body.endAt != null ? body.endAt : prev.end_at || "",
      seats: prev.seats || 0,
      cap: Number(body.cap) || prev.cap || 16,
      rules: String(copy.rules || prev.rules || ""),
      info: String(copy.info || prev.info || ""),
      prize: copy.prize || prev.prize || "",
      currency: copy.currency || prev.currency || "",
      stage,
      image: copy.cardUrl || copy.bannerUrl || prev.image || "",
      banner: copy.bannerUrl || copy.cardUrl || prev.banner || "",
      details: JSON.stringify(copy),
    };
  }

  function changed() {
    if (window.MHWhen) window.MHWhen.announce();
  }

  async function staticCall(path, options) {
    const method = (options.method || "GET").toUpperCase();
    const data = await ready();
    const body = options.body || {};
    if (method === "POST" && path === "/api/auth/login") {
      const email = String(body.email || "").trim().toLowerCase();
      const account = data.accounts.find((item) => item.email === email);
      const password = String(body.password || "");
      if (!account || (await digest(password, account.salt)) !== account.hash) return result(401, { error: "invalid" });
      localStorage.setItem("mh-token", "pub:" + account.email);
      return result(200, { token: "pub:" + account.email, user: publicUser(account) });
    }
    if (method === "POST" && path === "/api/auth/register") {
      const email = String(body.email || "").trim().toLowerCase();
      const name = String(body.name || "").trim();
      const password = String(body.password || "");
      if (!email.includes("@") || name.length < 2 || password.length < 8) return result(400, { error: "weak" });
      if (data.accounts.some((item) => item.email === email)) return result(409, { error: "taken" });
      const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
      const account = { id: Date.now(), email, name, role: "visitor", salt, hash: await digest(password, salt) };
      data.accounts.push(account);
      localStorage.setItem("mh-published-accounts", JSON.stringify(extras().concat(account)));
      localStorage.setItem("mh-token", "pub:" + email);
      return result(201, { token: "pub:" + email, user: publicUser(account) });
    }
    if (method === "GET" && path === "/api/auth/me") {
      const account = await accountFromToken();
      if (!account) return result(401, { error: "unauthorized" });
      return result(200, { user: publicUser(account) });
    }
    if (method === "GET" && path === "/api/public/tournaments") {
      return result(200, { tournaments: publicRows(merged(data)) });
    }
    if (method === "GET" && path === "/api/tournaments") {
      return result(200, { tournaments: merged(data) });
    }
    if (method === "POST" && path === "/api/tournaments") {
      const account = await accountFromToken();
      if (!account || account.role === "visitor") return result(403, { error: "forbidden" });
      const id = Date.now();
      const store = cupStore();
      store.rows[String(id)] = rowFrom(body, null, id);
      if (!remember(store)) return result(500, { error: "offline" });
      changed();
      return result(201, { id, status: store.rows[String(id)].status });
    }
    const cupPath = path.match(/^\/api\/tournaments\/(\d+)(\/decision)?$/);
    if (cupPath && (method === "PATCH" || method === "DELETE" || method === "POST")) {
      const account = await accountFromToken();
      if (!account || account.role === "visitor") return result(403, { error: "forbidden" });
      const id = cupPath[1];
      const store = cupStore();
      const current = merged(data).find((row) => String(row.id) === id);
      if (method === "DELETE") {
        if (!store.deleted.includes(id)) store.deleted.push(id);
        delete store.rows[id];
        if (!remember(store)) return result(500, { error: "offline" });
        changed();
        return result(200, { ok: true, id: Number(id) });
      }
      if (!current && !store.rows[id]) return result(404, { error: "not-found" });
      if (cupPath[2] === "/decision") {
        if (account.role !== "owner") return result(403, { error: "forbidden" });
        const status = body.decision === "approve" ? "open" : "rejected";
        store.rows[id] = { ...(current || store.rows[id]), status };
        if (!remember(store)) return result(500, { error: "offline" });
        changed();
        return result(200, { ok: true, id: Number(id), status });
      }
      store.deleted = store.deleted.filter((item) => item !== id);
      store.rows[id] = rowFrom(body, current || store.rows[id], Number(id));
      if (!remember(store)) return result(500, { error: "offline" });
      changed();
      return result(200, { ok: true, id: Number(id), status: store.rows[id].status });
    }
    if (method === "GET" && path === "/api/stats") {
      const cups = merged(data);
      return result(200, {
        tournaments: cups.length,
        matches: 0,
        pending: cups.filter((cup) => cup.status === "draft" || cup.status === "pending").length,
      });
    }
    if (method === "GET" && path === "/api/users") {
      const account = await accountFromToken();
      if (!account || account.role === "visitor") return result(403, { error: "forbidden" });
      return result(200, { users: data.accounts.map(publicUser) });
    }
    if (method === "GET" && ["/api/announcements", "/api/matches", "/api/teams", "/api/notifications", "/api/history", "/api/standings", "/api/comments", "/api/sponsors", "/api/registrations"].includes(path)) {
      const key = path.split("/").pop();
      return result(200, { [key]: [] });
    }
    if (method === "GET" && path === "/api/roles") return result(403, { error: "forbidden" });
    if (method === "GET" && path === "/api/settings") return result(200, { settings: [] });
    if (method === "GET" && path === "/api/database") return result(403, { error: "forbidden" });
    if (method === "GET" && path === "/api/logs") return result(403, { error: "forbidden" });
    return result(403, { error: "offline" });
  }

  async function call(path, options) {
    const opts = options || {};
    try {
      const res = await fetch(path, {
        method: opts.method || "GET",
        headers: {
          Authorization: "Bearer " + (localStorage.getItem("mh-token") || ""),
          ...(opts.body ? { "Content-Type": "application/json" } : {}),
        },
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        cache: "no-store",
      });
      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = null;
      }
      if (data && (res.ok || res.status !== 404)) return { ok: res.ok, status: res.status, ...data };
    } catch {
      /* the published site has no account server */
    }
    return staticCall(path, opts);
  }

  window.MHPublished = { call };
})();
