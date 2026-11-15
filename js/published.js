(() => {
  const ROLES = {
    owner: ["users.manage", "roles.manage", "analytics.view", "settings.manage", "sponsors.manage", "database.view", "logs.view", "tournaments.approve", "tournaments.manage", "matches.manage", "teams.manage", "registrations.approve", "results.update", "brackets.manage", "announcements.manage", "chat.moderate", "stats.view", "tournaments.view", "matches.view", "standings.view", "tournaments.join", "team.own", "profile.edit", "notifications.view", "history.view"],
    admin: ["tournaments.manage", "matches.manage", "teams.manage", "registrations.approve", "results.update", "brackets.manage", "announcements.manage", "chat.moderate", "stats.view", "tournaments.view", "matches.view", "standings.view", "tournaments.join", "team.own", "profile.edit", "notifications.view", "history.view"],
    visitor: ["tournaments.view", "matches.view", "standings.view", "tournaments.join", "team.own", "profile.edit", "notifications.view", "history.view"],
  };
  const RANKS = { owner: 100, admin: 50, visitor: 10 };
  let pack = null;
  let mode = "";

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

  function blankDesk() {
    const now = "2026-11-14T12:00:00.000Z";
    return {
      matches: [{ id: 1, tournament_id: 2, round: "Opening", team_a: "Visitor Unit", team_b: "TBD", score_a: null, score_b: null, status: "scheduled" }],
      teams: [{ id: 1, name: "Visitor Unit", game: "valorant", owner_id: 3, owner: "Visitor", status: "approved", created_at: now }],
      registrations: [{ id: 1, tournament_id: 2, team_id: 1, user_id: 3, status: "approved" }],
      announcements: [{ id: 1, title: "Season open", body: "Registration is open for the Valorant cup.", author_id: 1, created_at: now }],
      sponsors: [{ id: 1, name: "Female MENA", url: "https://hisham0almazrui.github.io/FemaleMENA/", status: "active" }],
      settings: [{ key: "siteName", value: "Female MENA" }, { key: "registration", value: "open" }],
      comments: [{ id: 1, user_id: 3, email: "visitor@femalemena.com", body: "Ready for the next map.", status: "visible", created_at: now }],
      notifications: [{ id: 1, user_id: 3, body: "Your team Visitor Unit was approved.", read: 0, created_at: now }],
      logs: [{ id: 1, user_id: 1, email: "owner@femalemena.com", action: "seed", target: "platform", detail: "Initial accounts created", created_at: now }],
      users: [],
      patches: {},
      deletedUsers: [],
    };
  }

  function loadDesk() {
    try {
      const saved = JSON.parse(localStorage.getItem("mh-desk") || "");
      if (saved && Array.isArray(saved.matches) && Array.isArray(saved.teams)) return saved;
    } catch {
      /* start from the published records */
    }
    const desk = blankDesk();
    localStorage.setItem("mh-desk", JSON.stringify(desk));
    return desk;
  }

  function saveDesk(desk) {
    localStorage.setItem("mh-desk", JSON.stringify(desk));
  }

  function allAccounts() {
    const desk = loadDesk();
    const gone = new Set(desk.deletedUsers || []);
    const patches = desk.patches || {};
    return [...(pack.accounts || []), ...(desk.users || [])]
      .filter((account) => account && !gone.has(account.email))
      .map((account) => ({ status: "active", ...account, ...(patches[account.email] || {}) }));
  }

  function allows(account, key) {
    if (!account || account.status === "suspended") return false;
    return (ROLES[account.role] || []).includes(key);
  }

  function nextId(desk) {
    const ids = [100];
    ["matches", "teams", "registrations", "announcements", "sponsors", "comments", "notifications", "logs", "users"].forEach((key) => {
      (desk[key] || []).forEach((row) => ids.push(Number(row.id) || 0));
    });
    return Math.max(...ids) + 1;
  }

  function logAction(desk, account, action, target, detail) {
    desk.logs.unshift({
      id: nextId(desk),
      user_id: account ? account.id : null,
      email: account ? account.email : "",
      action,
      target: String(target || ""),
      detail: String(detail || ""),
      created_at: new Date().toISOString(),
    });
  }

  function cupById(id) {
    return merged(pack).find((row) => String(row.id) === String(id)) || null;
  }

  function setSeats(id, delta) {
    const current = cupById(id);
    if (!current) return;
    const store = cupStore();
    const next = { ...current, seats: Math.max(0, (Number(current.seats) || 0) + delta) };
    store.deleted = store.deleted.filter((item) => item !== String(id));
    store.rows[String(id)] = next;
    remember(store);
    changed();
  }

  async function accountFromToken() {
    const email = sessionEmail();
    if (!email) return null;
    await ready();
    const account = allAccounts().find((item) => item.email === email) || null;
    if (!account || account.status === "suspended") return null;
    return account;
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
      const account = allAccounts().find((item) => item.email === email);
      const password = String(body.password || "");
      if (!account || (await digest(password, account.salt)) !== account.hash) return result(401, { error: "invalid" });
      if (account.status === "suspended") return result(403, { error: "suspended" });
      localStorage.setItem("mh-token", "pub:" + account.email);
      return result(200, { token: "pub:" + account.email, user: publicUser(account) });
    }
    if (method === "POST" && path === "/api/auth/register") {
      const email = String(body.email || "").trim().toLowerCase();
      const name = String(body.name || "").trim();
      const password = String(body.password || "");
      if (!email.includes("@") || name.length < 2 || password.length < 8) return result(400, { error: "weak" });
      if (allAccounts().some((item) => item.email === email)) return result(409, { error: "taken" });
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
    if (method === "GET" && path === "/api/public/matches") {
      const desk = loadDesk();
      const matches = desk.matches.map((row) => {
        const cup = merged(data).find((item) => String(item.id) === String(row.tournament_id));
        return { ...row, tournament: cup ? cup.name : "", game: cup ? cup.game : "", start_at: cup ? cup.start_at : "" };
      });
      return result(200, { matches });
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
        const desk = loadDesk();
        desk.matches = desk.matches.filter((row) => String(row.tournament_id) !== id);
        desk.registrations = desk.registrations.filter((row) => String(row.tournament_id) !== id);
        logAction(desk, account, "tournament.delete", id, "");
        saveDesk(desk);
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
    const handled = await deskCall(method, path, body);
    if (handled) return handled;
    return result(403, { error: "offline" });
  }

  async function deskCall(method, path, body) {
    const account = await accountFromToken();
    const desk = loadDesk();
    const cups = () => merged(pack);
    const need = (key) => {
      if (!account) return result(401, { error: "unauthorized" });
      if (!allows(account, key)) return result(403, { error: "forbidden" });
      return null;
    };
    if (method === "GET" && path === "/api/stats") {
      const blocked = need("stats.view") && need("analytics.view");
      if (blocked && !allows(account, "stats.view") && !allows(account, "analytics.view")) return blocked;
      const list = cups();
      const payload = {
        tournaments: list.length,
        matches: desk.matches.length,
        teams: desk.teams.length,
        pending: list.filter((cup) => cup.status === "draft" || cup.status === "pending").length,
      };
      if (allows(account, "analytics.view")) {
        const people = allAccounts();
        payload.users = people.length;
        payload.byRole = ["owner", "admin", "visitor"].map((role) => ({ role, n: people.filter((item) => item.role === role).length }));
        payload.games = ["cod", "valorant"].map((game) => ({ game, n: list.filter((cup) => cup.game === game).length }));
      }
      return result(200, payload);
    }
    if (method === "GET" && path === "/api/users") {
      const blocked = need("users.manage");
      if (blocked) return blocked;
      return result(200, { users: allAccounts().map(publicUser) });
    }
    if (method === "POST" && path === "/api/users") {
      const blocked = need("users.manage");
      if (blocked) return blocked;
      const email = String(body.email || "").trim().toLowerCase();
      const name = String(body.name || "").trim().slice(0, 60);
      const password = String(body.password || "");
      const role = ["owner", "admin", "visitor"].includes(body.role) ? body.role : "visitor";
      if ((RANKS[role] || 0) > (RANKS[account.role] || 0)) return result(403, { error: "escalate" });
      if (!email.includes("@") || name.length < 2 || password.length < 8) return result(400, { error: "weak" });
      if (allAccounts().some((item) => item.email === email)) return result(409, { error: "taken" });
      const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
      const created = { id: Date.now(), email, name, role, status: "active", salt, hash: await digest(password, salt) };
      desk.users.push(created);
      logAction(desk, account, "user.create", email, role);
      saveDesk(desk);
      return result(201, { id: created.id });
    }
    const userPath = path.match(/^\/api\/users\/(\d+)$/);
    if (userPath) {
      const blocked = need("users.manage");
      if (blocked) return blocked;
      const target = allAccounts().find((item) => String(item.id) === userPath[1]);
      if (!target) return result(404, { error: "not-found" });
      if ((RANKS[target.role] || 0) > (RANKS[account.role] || 0)) return result(403, { error: "escalate" });
      const owners = () => allAccounts().filter((item) => item.role === "owner" && item.status !== "suspended").length;
      if (method === "DELETE") {
        if (target.id === account.id || target.role === "owner") return result(403, { error: "escalate" });
        desk.deletedUsers.push(target.email);
        desk.users = desk.users.filter((item) => item.email !== target.email);
        logAction(desk, account, "user.delete", target.email, target.role);
        saveDesk(desk);
        return result(200, { ok: true });
      }
      if (method === "PATCH") {
        const status = body.status === "suspended" || body.status === "active" ? body.status : target.status;
        if (target.role === "owner" && status === "suspended" && owners() < 2) return result(409, { error: "last-owner" });
        desk.patches[target.email] = { ...(desk.patches[target.email] || {}), name: body.name ? String(body.name).trim().slice(0, 60) : target.name, role: target.role, status, salt: target.salt, hash: target.hash };
        logAction(desk, account, "user.update", target.email, status);
        saveDesk(desk);
        return result(200, { ok: true });
      }
    }
    if (method === "GET" && path === "/api/roles") {
      const blocked = need("roles.manage");
      if (blocked) return blocked;
      const permissions = ROLES.owner.map((key, index) => ({ id: index + 1, key, label: key, area: ROLES.visitor.includes(key) ? "public" : ROLES.admin.includes(key) ? "staff" : "owner" }));
      const roles = [{ id: 1, key: "owner", name: "Owner", rank: 100 }, { id: 2, key: "admin", name: "Admin", rank: 50 }, { id: 3, key: "visitor", name: "Visitor", rank: 10 }];
      const roleId = { owner: 1, admin: 2, visitor: 3 };
      const links = [];
      Object.entries(ROLES).forEach(([role, keys]) => keys.forEach((key) => links.push({ role_id: roleId[role], permission_id: permissions.find((item) => item.key === key).id })));
      return result(200, { roles, permissions, links });
    }
    if (method === "GET" && path === "/api/matches") {
      const blocked = need("matches.view");
      if (blocked) return blocked;
      const matches = desk.matches.map((row) => {
        const cup = cups().find((item) => String(item.id) === String(row.tournament_id));
        return { ...row, tournament: cup ? cup.name : "", game: cup ? cup.game : "", start_at: cup ? cup.start_at : "" };
      });
      return result(200, { matches });
    }
    if (method === "POST" && path === "/api/matches") {
      const blocked = need("matches.manage");
      if (blocked) return blocked;
      const created = { id: nextId(desk), tournament_id: Number(body.tournamentId), round: String(body.round || "Round").slice(0, 40), team_a: String(body.teamA || "TBD").slice(0, 40), team_b: String(body.teamB || "TBD").slice(0, 40), score_a: null, score_b: null, status: "scheduled" };
      desk.matches.push(created);
      logAction(desk, account, "match.create", created.tournament_id, created.team_a + " vs " + created.team_b);
      saveDesk(desk);
      changed();
      return result(201, { id: created.id });
    }
    const matchPath = path.match(/^\/api\/matches\/(\d+)$/);
    if (matchPath) {
      const row = desk.matches.find((item) => String(item.id) === matchPath[1]);
      if (!row) return result(404, { error: "not-found" });
      if (method === "DELETE") {
        const blocked = need("matches.manage");
        if (blocked) return blocked;
        desk.matches = desk.matches.filter((item) => item !== row);
        logAction(desk, account, "match.delete", row.id, "");
        saveDesk(desk);
        changed();
        return result(200, { ok: true });
      }
      if (method === "PATCH") {
        if (!allows(account, "results.update") && !allows(account, "brackets.manage")) return result(403, { error: "forbidden" });
        row.score_a = body.scoreA == null || body.scoreA === "" ? row.score_a : Number(body.scoreA);
        row.score_b = body.scoreB == null || body.scoreB === "" ? row.score_b : Number(body.scoreB);
        row.status = body.status || row.status;
        logAction(desk, account, "match.update", row.id, row.score_a + "-" + row.score_b);
        saveDesk(desk);
        changed();
        return result(200, { ok: true });
      }
    }
    if (method === "GET" && path === "/api/teams") {
      if (allows(account, "teams.manage")) return result(200, { teams: desk.teams });
      const blocked = need("team.own");
      if (blocked) return blocked;
      return result(200, { teams: desk.teams.filter((item) => item.owner_id === account.id) });
    }
    if (method === "POST" && path === "/api/teams") {
      const blocked = need("team.own");
      if (blocked) return blocked;
      if (desk.teams.some((item) => item.owner_id === account.id)) return result(409, { error: "taken" });
      const name = String(body.name || "").trim().slice(0, 40);
      if (name.length < 2) return result(400, { error: "weak" });
      const created = { id: nextId(desk), name, game: body.game === "valorant" ? "valorant" : "cod", owner_id: account.id, owner: account.name, status: "pending", created_at: new Date().toISOString() };
      desk.teams.push(created);
      logAction(desk, account, "team.create", name, created.game);
      saveDesk(desk);
      return result(201, { id: created.id });
    }
    const teamPath = path.match(/^\/api\/teams\/(\d+)$/);
    if (teamPath && method === "PATCH") {
      const row = desk.teams.find((item) => String(item.id) === teamPath[1]);
      if (!row) return result(404, { error: "not-found" });
      if (allows(account, "teams.manage") && body.status) {
        row.status = ["approved", "rejected", "pending"].includes(body.status) ? body.status : row.status;
        logAction(desk, account, "team.update", row.name, row.status);
        saveDesk(desk);
        return result(200, { ok: true });
      }
      if (row.owner_id !== account.id) return result(403, { error: "forbidden" });
      row.name = String(body.name || row.name).trim().slice(0, 40);
      saveDesk(desk);
      return result(200, { ok: true });
    }
    const joined = () => desk.registrations.map((row) => {
      const team = desk.teams.find((item) => item.id === row.team_id);
      const cup = cups().find((item) => String(item.id) === String(row.tournament_id));
      return { ...row, team: team ? team.name : "", tournament: cup ? cup.name : "", start_at: cup ? cup.start_at : "" };
    });
    if (method === "GET" && path === "/api/registrations") {
      if (allows(account, "registrations.approve")) return result(200, { registrations: joined() });
      const blocked = need("tournaments.join");
      if (blocked) return blocked;
      return result(200, { registrations: joined().filter((row) => row.user_id === account.id) });
    }
    if (method === "POST" && path === "/api/registrations") {
      const blocked = need("tournaments.join");
      if (blocked) return blocked;
      const cup = cupById(body.tournamentId);
      const team = desk.teams.find((item) => item.id === Number(body.teamId));
      if (!cup || cup.status !== "open" || !team || team.owner_id !== account.id || team.status !== "approved") return result(403, { error: "forbidden" });
      if (desk.registrations.some((row) => row.tournament_id === cup.id && row.team_id === team.id)) return result(409, { error: "taken" });
      desk.registrations.push({ id: nextId(desk), tournament_id: cup.id, team_id: team.id, user_id: account.id, status: "pending" });
      logAction(desk, account, "registration.create", cup.name, team.name);
      saveDesk(desk);
      setSeats(cup.id, 1);
      return result(201, { id: desk.registrations.at(-1).id });
    }
    const regPath = path.match(/^\/api\/registrations\/(\d+)$/);
    if (regPath) {
      const row = desk.registrations.find((item) => String(item.id) === regPath[1]);
      if (!row) return result(404, { error: "not-found" });
      if (method === "DELETE") {
        const blocked = need("tournaments.join");
        if (blocked) return blocked;
        if (row.user_id !== account.id) return result(403, { error: "forbidden" });
        desk.registrations = desk.registrations.filter((item) => item !== row);
        logAction(desk, account, "registration.leave", row.tournament_id, "");
        saveDesk(desk);
        if (row.status !== "rejected") setSeats(row.tournament_id, -1);
        return result(200, { ok: true });
      }
      if (method === "PATCH") {
        const blocked = need("registrations.approve");
        if (blocked) return blocked;
        const status = body.status === "rejected" ? "rejected" : "approved";
        if (row.status !== "rejected" && status === "rejected") setSeats(row.tournament_id, -1);
        if (row.status === "rejected" && status === "approved") setSeats(row.tournament_id, 1);
        row.status = status;
        logAction(desk, account, "registration.update", row.id, status);
        saveDesk(desk);
        return result(200, { ok: true });
      }
    }
    if (method === "GET" && path === "/api/announcements") {
      if (!account) return result(401, { error: "unauthorized" });
      return result(200, { announcements: desk.announcements });
    }
    if (method === "POST" && path === "/api/announcements") {
      const blocked = need("announcements.manage");
      if (blocked) return blocked;
      const title = String(body.title || "").trim().slice(0, 80);
      const text = String(body.body || "").trim().slice(0, 400);
      if (title.length < 2) return result(400, { error: "weak" });
      const now = new Date().toISOString();
      desk.announcements.unshift({ id: nextId(desk), title, body: text, author_id: account.id, created_at: now });
      allAccounts().filter((item) => item.status !== "suspended").forEach((item) => desk.notifications.unshift({ id: nextId(desk), user_id: item.id, body: title, read: 0, created_at: now }));
      logAction(desk, account, "announcement.create", title, "");
      saveDesk(desk);
      return result(201, { id: desk.announcements[0].id });
    }
    const newsPath = path.match(/^\/api\/announcements\/(\d+)$/);
    if (newsPath && method === "DELETE") {
      const blocked = need("announcements.manage");
      if (blocked) return blocked;
      desk.announcements = desk.announcements.filter((item) => String(item.id) !== newsPath[1]);
      logAction(desk, account, "announcement.delete", newsPath[1], "");
      saveDesk(desk);
      return result(200, { ok: true });
    }
    if (path === "/api/sponsors" || /^\/api\/sponsors\/\d+$/.test(path)) {
      const blocked = need("sponsors.manage");
      if (blocked) return blocked;
      if (method === "GET") return result(200, { sponsors: desk.sponsors });
      if (method === "POST") {
        const name = String(body.name || "").trim().slice(0, 60);
        if (name.length < 2) return result(400, { error: "weak" });
        const created = { id: nextId(desk), name, url: String(body.url || "").slice(0, 160), status: "active" };
        desk.sponsors.unshift(created);
        logAction(desk, account, "sponsor.create", name, "");
        saveDesk(desk);
        return result(201, { id: created.id });
      }
      if (method === "DELETE") {
        desk.sponsors = desk.sponsors.filter((item) => String(item.id) !== path.split("/").pop());
        logAction(desk, account, "sponsor.delete", path.split("/").pop(), "");
        saveDesk(desk);
        return result(200, { ok: true });
      }
    }
    if (path === "/api/settings") {
      const blocked = need("settings.manage");
      if (blocked) return blocked;
      if (method === "GET") return result(200, { settings: desk.settings });
      if (method === "PATCH") {
        Object.entries(body || {}).slice(0, 20).forEach(([key, value]) => {
          if (!/^[a-zA-Z]{2,24}$/.test(key)) return;
          const found = desk.settings.find((item) => item.key === key);
          if (found) found.value = String(value).slice(0, 120);
          else desk.settings.push({ key, value: String(value).slice(0, 120) });
        });
        logAction(desk, account, "settings.update", "settings", Object.keys(body || {}).join(","));
        saveDesk(desk);
        return result(200, { ok: true });
      }
    }
    if (method === "GET" && path === "/api/database") {
      const blocked = need("database.view");
      if (blocked) return blocked;
      const tables = [
        ["users", allAccounts().length],
        ["tournaments", cups().length],
        ["matches", desk.matches.length],
        ["teams", desk.teams.length],
        ["registrations", desk.registrations.length],
        ["announcements", desk.announcements.length],
        ["sponsors", desk.sponsors.length],
        ["settings", desk.settings.length],
        ["comments", desk.comments.length],
        ["notifications", desk.notifications.length],
        ["audit_logs", desk.logs.length],
      ];
      return result(200, { tables: tables.map(([name, rows]) => ({ name, rows })) });
    }
    if (method === "GET" && path === "/api/logs") {
      const blocked = need("logs.view");
      if (blocked) return blocked;
      return result(200, { logs: desk.logs.slice(0, 80) });
    }
    if (method === "POST" && path === "/api/support") {
      const name = String(body.name || "").trim().slice(0, 60);
      const email = String(body.email || "").trim().slice(0, 80);
      const message = String(body.message || "").trim().slice(0, 500);
      if (name.length < 2 || !email.includes("@") || message.length < 2) return result(400, { error: "weak" });
      desk.comments.unshift({ id: nextId(desk), user_id: account ? account.id : null, email, body: name + ": " + message, status: "visible", created_at: new Date().toISOString() });
      saveDesk(desk);
      return result(201, { ok: true });
    }
    if (path === "/api/comments" || /^\/api\/comments\/\d+$/.test(path)) {
      const blocked = need("chat.moderate");
      if (blocked) return blocked;
      if (method === "GET") return result(200, { comments: desk.comments });
      if (method === "PATCH") {
        const row = desk.comments.find((item) => String(item.id) === path.split("/").pop());
        if (!row) return result(404, { error: "not-found" });
        row.status = body.status === "hidden" ? "hidden" : "visible";
        logAction(desk, account, "comment.moderate", row.id, row.status);
        saveDesk(desk);
        return result(200, { ok: true });
      }
    }
    if (method === "GET" && path === "/api/notifications") {
      const blocked = need("notifications.view");
      if (blocked) return blocked;
      return result(200, { notifications: desk.notifications.filter((item) => item.user_id === account.id) });
    }
    if (method === "PATCH" && path === "/api/profile") {
      const blocked = need("profile.edit");
      if (blocked) return blocked;
      const name = String(body.name || account.name).trim().slice(0, 60);
      if (name.length < 2) return result(400, { error: "weak" });
      const patch = { ...(desk.patches[account.email] || {}), name, role: account.role, status: account.status, salt: account.salt, hash: account.hash };
      if (body.password) {
        if (String(body.password).length < 8) return result(400, { error: "weak" });
        patch.salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
        patch.hash = await digest(String(body.password), patch.salt);
      }
      desk.patches[account.email] = patch;
      const extra = desk.users.find((item) => item.email === account.email);
      if (extra) Object.assign(extra, { name, salt: patch.salt, hash: patch.hash });
      logAction(desk, account, "profile.update", account.email, "");
      saveDesk(desk);
      return result(200, { ok: true, name });
    }
    if (method === "GET" && path === "/api/history") {
      const blocked = need("history.view");
      if (blocked) return blocked;
      const history = joined().filter((row) => row.user_id === account.id).map((row) => ({ status: row.status, name: row.tournament, game: (cups().find((item) => item.name === row.tournament) || {}).game || "", start_at: row.start_at }));
      return result(200, { history });
    }
    if (method === "GET" && path === "/api/standings") {
      const blocked = need("standings.view");
      if (blocked) return blocked;
      const table = new Map();
      desk.matches.filter((row) => row.status === "finished").forEach((row) => {
        [row.team_a, row.team_b].forEach((name) => { if (name && !table.has(name)) table.set(name, { name, wins: 0, losses: 0 }); });
        if (row.score_a == null || row.score_b == null || row.score_a === row.score_b) return;
        const winner = row.score_a > row.score_b ? row.team_a : row.team_b;
        const loser = winner === row.team_a ? row.team_b : row.team_a;
        if (table.has(winner)) table.get(winner).wins += 1;
        if (table.has(loser)) table.get(loser).losses += 1;
      });
      return result(200, { standings: [...table.values()].sort((a, b) => b.wins - a.wins) });
    }
    return null;
  }

  async function chooseMode() {
    if (mode) return mode;
    if (/github\.io$/i.test(location.hostname)) {
      mode = "static";
      return mode;
    }
    try {
      const probe = await fetch("/api/public/tournaments", { cache: "no-store" });
      const text = await probe.text();
      JSON.parse(text);
      mode = probe.ok ? "api" : "static";
    } catch {
      mode = "static";
    }
    return mode;
  }

  async function call(path, options) {
    const opts = options || {};
    if ((await chooseMode()) === "static") return staticCall(path, opts);
    const res = await fetch(path, {
      method: opts.method || "GET",
      headers: {
        Authorization: "Bearer " + (localStorage.getItem("mh-token") || ""),
        ...(opts.body ? { "Content-Type": "application/json" } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, ...data };
  }

  window.MHPublished = { call };
})();
