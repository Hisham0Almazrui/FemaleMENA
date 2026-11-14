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
    if (method === "GET" && (path === "/api/public/tournaments" || path === "/api/tournaments")) {
      return result(200, { tournaments: data.tournaments });
    }
    if (method === "GET" && path === "/api/stats") {
      return result(200, {
        tournaments: data.tournaments.length,
        matches: 0,
        pending: data.tournaments.filter((cup) => cup.status === "draft" || cup.status === "pending").length,
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
