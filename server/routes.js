const { db, audit, permissionsFor } = require("./db");
const { hashPassword, verifyPassword, signToken, readToken } = require("./auth");
const fs = require("fs");
const path = require("path");

const fails = new Map();

function tooMany(email) {
  const row = fails.get(email);
  if (!row) return false;
  if (Date.now() - row.start > 15 * 60 * 1000) {
    fails.delete(email);
    return false;
  }
  return row.count >= 8;
}

function markFail(email) {
  const row = fails.get(email);
  if (!row || Date.now() - row.start > 15 * 60 * 1000) fails.set(email, { count: 1, start: Date.now() });
  else row.count += 1;
}

function actorFrom(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const payload = readToken(token);
  if (!payload) return null;
  const user = db
    .prepare(
      `SELECT users.*, roles.key AS role, roles.rank AS rank
       FROM users JOIN roles ON roles.id = users.role_id WHERE users.id = ?`
    )
    .get(payload.sub);
  if (!user || user.status !== "active") return null;
  user.permissions = new Set(permissionsFor(user.role_id, user.role));
  return user;
}

function can(user, key) {
  return Boolean(user && user.permissions.has(key));
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    rank: user.rank,
    status: user.status,
    permissions: [...user.permissions],
  };
}

function ownerCount() {
  return db.prepare("SELECT COUNT(*) AS n FROM users JOIN roles ON roles.id = users.role_id WHERE roles.key = 'owner' AND users.status = 'active'").get().n;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 4_000_000) {
        reject(new Error("large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new Error("json"));
      }
    });
    req.on("error", reject);
  });
}

function send(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(data));
}

function guard(res, user, key) {
  if (!user) {
    send(res, 401, { error: "unauthorized" });
    return false;
  }
  if (!can(user, key)) {
    send(res, 403, { error: "forbidden" });
    return false;
  }
  return true;
}

async function handleApi(req, res) {
  const url = new URL(req.url, "http://localhost");
  const pathname = url.pathname;
  if (!pathname.startsWith("/api/")) return false;
  let body = {};
  if (req.method === "POST" || req.method === "PATCH") {
    try {
      body = await readBody(req);
    } catch {
      send(res, 400, { error: "bad-json" });
      return true;
    }
  }
  const actor = actorFrom(req);
  const found = matchRoute(req.method, pathname);
  if (!found) {
    send(res, 404, { error: "not-found" });
    return true;
  }
  try {
    await found.handler(req, res, { body, actor, params: found.params, query: url.searchParams });
  } catch (error) {
    send(res, 500, { error: "server" });
  }
  return true;
}

function matchRoute(method, pathname) {
  for (const [m, pattern, handler] of routes) {
    if (m !== method) continue;
    const names = [];
    const rx = new RegExp("^" + pattern.replace(/:([A-Za-z]+)/g, (_, name) => { names.push(name); return "([^/]+)"; }) + "$");
    const hit = pathname.match(rx);
    if (!hit) continue;
    const params = {};
    names.forEach((name, index) => { params[name] = decodeURIComponent(hit[index + 1]); });
    return { handler, params };
  }
  return null;
}

function login(req, res, { body }) {
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (tooMany(email)) return send(res, 429, { error: "locked" });
  const user = db.prepare(`SELECT users.*, roles.key AS role, roles.rank AS rank FROM users JOIN roles ON roles.id = users.role_id WHERE email = ?`).get(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    markFail(email);
    audit(user && user.id, "login_failed", email, "Rejected sign-in");
    return send(res, 401, { error: "invalid" });
  }
  if (user.status !== "active") return send(res, 403, { error: "suspended" });
  fails.delete(email);
  user.permissions = new Set(permissionsFor(user.role_id, user.role));
  audit(user.id, "login", user.email, user.role);
  send(res, 200, { token: signToken(user.id), user: publicUser(user) });
}

function register(req, res, { body }) {
  const email = String(body.email || "").trim().toLowerCase();
  const name = String(body.name || "").trim().slice(0, 60);
  const password = String(body.password || "");
  if (!email.includes("@") || name.length < 2 || password.length < 8) return send(res, 400, { error: "weak" });
  if (db.prepare("SELECT id FROM users WHERE email = ?").get(email)) return send(res, 409, { error: "taken" });
  const role = db.prepare("SELECT id FROM roles WHERE key = 'visitor'").get();
  const now = new Date().toISOString();
  const created = db.prepare(
    "INSERT INTO users (email, name, password_hash, role_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'active', ?, ?)"
  ).run(email, name, hashPassword(password), role.id, now, now);
  const user = db.prepare(`SELECT users.*, roles.key AS role, roles.rank AS rank FROM users JOIN roles ON roles.id = users.role_id WHERE users.id = ?`).get(created.lastInsertRowid);
  user.permissions = new Set(permissionsFor(user.role_id, user.role));
  audit(user.id, "register", email, "visitor");
  send(res, 201, { token: signToken(user.id), user: publicUser(user) });
}

function me(req, res, { actor }) {
  if (!guard(res, actor, "tournaments.view")) return;
  send(res, 200, { user: publicUser(actor) });
}

function listUsers(req, res, { actor }) {
  if (!guard(res, actor, "users.manage")) return;
  const rows = db.prepare(
    `SELECT users.id, users.email, users.name, users.status, users.created_at, roles.key AS role, roles.rank AS rank
     FROM users JOIN roles ON roles.id = users.role_id ORDER BY roles.rank DESC, users.id`
  ).all();
  send(res, 200, { users: rows });
}

function createUser(req, res, { actor, body }) {
  if (!guard(res, actor, "users.manage")) return;
  const email = String(body.email || "").trim().toLowerCase();
  const name = String(body.name || "").trim().slice(0, 60);
  const password = String(body.password || "");
  const roleKey = String(body.role || "visitor");
  const role = db.prepare("SELECT * FROM roles WHERE key = ?").get(roleKey);
  if (!role || role.rank > actor.rank) return send(res, 403, { error: "escalate" });
  if (!email.includes("@") || name.length < 2 || password.length < 8) return send(res, 400, { error: "weak" });
  if (db.prepare("SELECT id FROM users WHERE email = ?").get(email)) return send(res, 409, { error: "taken" });
  const now = new Date().toISOString();
  const created = db.prepare(
    "INSERT INTO users (email, name, password_hash, role_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'active', ?, ?)"
  ).run(email, name, hashPassword(password), role.id, now, now);
  audit(actor.id, "user.create", email, role.key);
  send(res, 201, { id: created.lastInsertRowid });
}

function updateUser(req, res, { actor, body, params }) {
  if (!guard(res, actor, "users.manage")) return;
  const target = db.prepare(`SELECT users.*, roles.key AS role, roles.rank AS rank FROM users JOIN roles ON roles.id = users.role_id WHERE users.id = ?`).get(Number(params.id));
  if (!target) return send(res, 404, { error: "not-found" });
  if (target.rank > actor.rank || (target.role === "owner" && actor.role !== "owner")) return send(res, 403, { error: "escalate" });
  let roleId = target.role_id;
  if (body.role) {
    const role = db.prepare("SELECT * FROM roles WHERE key = ?").get(String(body.role));
    if (!role || role.rank > actor.rank) return send(res, 403, { error: "escalate" });
    if (target.role === "owner" && role.key !== "owner" && ownerCount() < 2) return send(res, 409, { error: "last-owner" });
    roleId = role.id;
  }
  const status = body.status === "suspended" || body.status === "active" ? body.status : target.status;
  if (target.role === "owner" && status === "suspended" && ownerCount() < 2) return send(res, 409, { error: "last-owner" });
  const name = body.name ? String(body.name).trim().slice(0, 60) : target.name;
  db.prepare("UPDATE users SET name = ?, role_id = ?, status = ?, updated_at = ? WHERE id = ?").run(name, roleId, status, new Date().toISOString(), target.id);
  audit(actor.id, "user.update", target.email, `${status}:${body.role || target.role}`);
  send(res, 200, { ok: true });
}

function deleteUser(req, res, { actor, params }) {
  if (!guard(res, actor, "users.manage")) return;
  const target = db.prepare(`SELECT users.*, roles.key AS role, roles.rank AS rank FROM users JOIN roles ON roles.id = users.role_id WHERE users.id = ?`).get(Number(params.id));
  if (!target) return send(res, 404, { error: "not-found" });
  if (target.id === actor.id || target.rank > actor.rank || target.role === "owner") return send(res, 403, { error: "escalate" });
  db.prepare("DELETE FROM users WHERE id = ?").run(target.id);
  audit(actor.id, "user.delete", target.email, target.role);
  send(res, 200, { ok: true });
}

function listRoles(req, res, { actor }) {
  if (!guard(res, actor, "roles.manage")) return;
  const roles = db.prepare("SELECT id, key, name, rank FROM roles ORDER BY rank DESC").all();
  const perms = db.prepare("SELECT id, key, label, area FROM permissions ORDER BY area, key").all();
  const links = db.prepare("SELECT role_id, permission_id FROM role_permissions").all();
  send(res, 200, { roles, permissions: perms, links });
}

function listTournaments(req, res, { actor }) {
  if (!guard(res, actor, "tournaments.view")) return;
  send(res, 200, { tournaments: db.prepare("SELECT * FROM tournaments ORDER BY id DESC").all() });
}

function saveCupImage(dataUrl, fileName) {
  const match = String(dataUrl || "").match(/^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) return "";
  const ext = match[1] === "jpeg" || match[1] === "jpg" ? "jpg" : match[1];
  const buf = Buffer.from(match[2], "base64");
  if (!buf.length || buf.length > 2_500_000) return "";
  const dir = path.join(__dirname, "..", "media", "cups");
  fs.mkdirSync(dir, { recursive: true });
  ["jpg", "png", "webp"].forEach((old) => {
    const previous = path.join(dir, `${fileName}.${old}`);
    if (fs.existsSync(previous)) fs.unlinkSync(previous);
  });
  fs.writeFileSync(path.join(dir, `${fileName}.${ext}`), buf);
  return `media/cups/${fileName}.${ext}`;
}

function removeCupFiles(id, keys) {
  const dir = path.join(__dirname, "..", "media", "cups");
  keys.forEach((key) => {
    ["jpg", "jpeg", "png", "webp"].forEach((ext) => {
      const file = path.join(dir, `${id}-${key}.${ext}`);
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });
  });
}

function storeInstant(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(text)) {
    const date = new Date(text);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  }
  const naive = text.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
  if (naive) {
    const date = new Date(`${naive[1]}T${naive[2]}:00+03:00`);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  }
  return text.slice(0, 40);
}

const LISTING_STATUS = new Set(["draft", "pending", "open", "live", "ended"]);

function persistDetails(details, id) {
  const copy = { ...(details || {}) };
  ["startAt", "endAt", "regOpen", "regClose"].forEach((key) => {
    if (copy[key]) copy[key] = storeInstant(copy[key]);
  });
  delete copy.logoData;
  delete copy.logoUrl;
  delete copy.logoName;
  let changed = false;
  ["card", "banner"].forEach((key) => {
    const data = copy[key + "Data"];
    if (typeof data === "string" && data.startsWith("data:image/")) {
      const saved = saveCupImage(data, `${id}-${key}`);
      if (saved) {
        copy[key + "Url"] = saved;
        changed = true;
      }
    }
    delete copy[key + "Data"];
  });
  if (changed) copy.imageRev = Date.now();
  removeCupFiles(id, ["logo"]);
  return JSON.stringify(copy).slice(0, 20000);
}

function freshImage(url, rev) {
  const clean = String(url || "").split("?")[0];
  if (!clean || clean.includes("-logo.")) return "";
  return rev ? `${clean}?v=${rev}` : clean;
}

function dropStoredLogos() {
  const rows = db.prepare("SELECT id, details FROM tournaments").all();
  rows.forEach((row) => {
    let details = {};
    try {
      details = JSON.parse(row.details || "{}");
    } catch {
      return;
    }
    if (!("logoUrl" in details) && !("logoData" in details) && !("logoName" in details)) return;
    delete details.logoUrl;
    delete details.logoData;
    delete details.logoName;
    db.prepare("UPDATE tournaments SET details = ? WHERE id = ?").run(JSON.stringify(details), row.id);
    removeCupFiles(row.id, ["logo"]);
  });
}
dropStoredLogos();

function migrateTournamentTimes() {
  const rows = db.prepare("SELECT id, start_at, end_at, details FROM tournaments").all();
  rows.forEach((row) => {
    const start = storeInstant(row.start_at);
    const end = storeInstant(row.end_at);
    let details = {};
    try {
      details = JSON.parse(row.details || "{}");
    } catch {
      details = {};
    }
    let dirty = start !== (row.start_at || "") || end !== (row.end_at || "");
    ["startAt", "endAt", "regOpen", "regClose"].forEach((key) => {
      if (!details[key]) return;
      const next = storeInstant(details[key]);
      if (next !== details[key]) {
        details[key] = next;
        dirty = true;
      }
    });
    if (!dirty) return;
    db.prepare("UPDATE tournaments SET start_at = ?, end_at = ?, details = ? WHERE id = ?").run(start, end, JSON.stringify(details), row.id);
  });
}
migrateTournamentTimes();

function listPublicMatches(req, res) {
  const matches = db.prepare(
    `SELECT matches.id, matches.tournament_id, matches.round, matches.team_a, matches.team_b, matches.score_a, matches.score_b, matches.status,
            tournaments.name AS tournament, tournaments.game, tournaments.start_at
     FROM matches JOIN tournaments ON tournaments.id = matches.tournament_id
     ORDER BY matches.id DESC`
  ).all();
  send(res, 200, { matches });
}

function listPublicTournaments(req, res) {
  const rows = db.prepare(
    "SELECT id, game, name, status, summary, start_at, end_at, seats, cap, details FROM tournaments WHERE status != 'rejected' ORDER BY id DESC"
  ).all();
  const tournaments = rows.flatMap((row) => {
    let details = {};
    try {
      details = JSON.parse(row.details || "{}");
    } catch {
      details = {};
    }
    if (details.visibility === "private") return [];
    const stage = Array.isArray(details.stages) ? details.stages[0] || null : null;
    return [{
      id: row.id,
      game: row.game,
      name: row.name,
      status: row.status,
      summary: row.summary || "",
      start_at: row.start_at || "",
      end_at: row.end_at || "",
      seats: row.seats,
      cap: row.cap,
      rules: String(details.rules || "").slice(0, 2000),
      info: String(details.info || "").slice(0, 800),
      prize: details.prize || "",
      currency: details.currency || "",
      stage,
      image: freshImage(details.cardUrl || details.bannerUrl || "", details.imageRev),
      banner: freshImage(details.bannerUrl || details.cardUrl || "", details.imageRev),
    }];
  });
  send(res, 200, { tournaments });
}

function createTournament(req, res, { actor, body }) {
  if (!guard(res, actor, "tournaments.manage")) return;
  const name = String(body.name || "").trim().slice(0, 80);
  const game = body.game === "valorant" ? "valorant" : "cod";
  if (name.length < 2) return send(res, 400, { error: "weak" });
  const status = LISTING_STATUS.has(body.status) ? body.status : "draft";
  const created = db.prepare(
    "INSERT INTO tournaments (game, name, status, summary, start_at, end_at, seats, cap, created_by, created_at, details) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)"
  ).run(
    game,
    name,
    status,
    String(body.summary || "").slice(0, 240),
    storeInstant(body.startAt),
    storeInstant(body.endAt),
    Number(body.cap) || 16,
    actor.id,
    new Date().toISOString(),
    "{}"
  );
  const details = persistDetails(body.details || {}, created.lastInsertRowid);
  db.prepare("UPDATE tournaments SET details = ? WHERE id = ?").run(details, created.lastInsertRowid);
  audit(actor.id, "tournament.create", name, status);
  send(res, 201, { id: created.lastInsertRowid, status });
}

function updateTournament(req, res, { actor, body, params }) {
  if (!guard(res, actor, "tournaments.manage")) return;
  const row = db.prepare("SELECT * FROM tournaments WHERE id = ?").get(Number(params.id));
  if (!row) return send(res, 404, { error: "not-found" });
  const name = body.name ? String(body.name).trim().slice(0, 80) : row.name;
  const summary = body.summary != null ? String(body.summary).slice(0, 240) : row.summary;
  const game = body.game === "valorant" ? "valorant" : body.game === "cod" ? "cod" : row.game;
  const startAt = body.startAt != null ? storeInstant(body.startAt) : row.start_at;
  const endAt = body.endAt != null ? storeInstant(body.endAt) : row.end_at;
  const details = body.details ? persistDetails(body.details, row.id) : row.details;
  let status = row.status;
  const requested = String(body.status || "");
  if (requested && requested !== row.status && LISTING_STATUS.has(requested) && can(actor, "tournaments.manage")) {
    if (requested !== "rejected" && row.status !== "rejected") status = requested;
    if (row.status === "rejected" && can(actor, "tournaments.approve")) status = requested;
  }
  db.prepare("UPDATE tournaments SET game = ?, name = ?, summary = ?, status = ?, start_at = ?, end_at = ?, cap = ?, details = ? WHERE id = ?").run(
    game, name, summary, status, startAt, endAt, Number(body.cap) || row.cap, details, row.id
  );
  audit(actor.id, "tournament.update", name, status);
  send(res, 200, { ok: true, id: row.id, status });
}

function deleteTournament(req, res, { actor, params }) {
  if (!guard(res, actor, "tournaments.manage")) return;
  const row = db.prepare("SELECT * FROM tournaments WHERE id = ?").get(Number(params.id));
  if (!row) return send(res, 404, { error: "not-found" });
  db.prepare("DELETE FROM matches WHERE tournament_id = ?").run(row.id);
  db.prepare("DELETE FROM registrations WHERE tournament_id = ?").run(row.id);
  db.prepare("DELETE FROM tournaments WHERE id = ?").run(row.id);
  removeCupFiles(row.id, ["logo", "card", "banner"]);
  audit(actor.id, "tournament.delete", row.name, row.game);
  send(res, 200, { ok: true });
}

function decideTournament(req, res, { actor, body, params }) {
  if (!guard(res, actor, "tournaments.approve")) return;
  const row = db.prepare("SELECT * FROM tournaments WHERE id = ?").get(Number(params.id));
  if (!row) return send(res, 404, { error: "not-found" });
  const status = body.decision === "approve" ? "open" : "rejected";
  db.prepare("UPDATE tournaments SET status = ? WHERE id = ?").run(status, row.id);
  audit(actor.id, "tournament.decision", row.name, status);
  send(res, 200, { ok: true, status });
}

function listMatches(req, res, { actor }) {
  if (!guard(res, actor, "matches.view")) return;
  send(res, 200, { matches: db.prepare("SELECT matches.*, tournaments.name AS tournament, tournaments.game, tournaments.start_at FROM matches JOIN tournaments ON tournaments.id = matches.tournament_id ORDER BY matches.id DESC").all() });
}

function createMatch(req, res, { actor, body }) {
  if (!guard(res, actor, "matches.manage")) return;
  const created = db.prepare(
    "INSERT INTO matches (tournament_id, round, team_a, team_b, score_a, score_b, status) VALUES (?, ?, ?, ?, ?, ?, 'scheduled')"
  ).run(Number(body.tournamentId), String(body.round || "Round"), String(body.teamA || "TBD"), String(body.teamB || "TBD"), null, null);
  audit(actor.id, "match.create", String(body.tournamentId), `${body.teamA} vs ${body.teamB}`);
  send(res, 201, { id: created.lastInsertRowid });
}

function updateMatch(req, res, { actor, body, params }) {
  if (!actor) return send(res, 401, { error: "unauthorized" });
  if (!can(actor, "results.update") && !can(actor, "brackets.manage")) return send(res, 403, { error: "forbidden" });
  const row = db.prepare("SELECT * FROM matches WHERE id = ?").get(Number(params.id));
  if (!row) return send(res, 404, { error: "not-found" });
  db.prepare("UPDATE matches SET round = ?, team_a = ?, team_b = ?, score_a = ?, score_b = ?, status = ? WHERE id = ?").run(
    body.round || row.round,
    body.teamA || row.team_a,
    body.teamB || row.team_b,
    body.scoreA == null || body.scoreA === "" ? row.score_a : Number(body.scoreA),
    body.scoreB == null || body.scoreB === "" ? row.score_b : Number(body.scoreB),
    body.status || (body.scoreA != null ? "finished" : row.status),
    row.id
  );
  audit(actor.id, "match.update", String(row.id), `${body.scoreA}-${body.scoreB}`);
  send(res, 200, { ok: true });
}

function deleteMatch(req, res, { actor, params }) {
  if (!guard(res, actor, "matches.manage")) return;
  db.prepare("DELETE FROM matches WHERE id = ?").run(Number(params.id));
  audit(actor.id, "match.delete", params.id, "");
  send(res, 200, { ok: true });
}

function listTeams(req, res, { actor }) {
  if (can(actor, "teams.manage")) {
    return send(res, 200, { teams: db.prepare("SELECT teams.*, users.name AS owner FROM teams JOIN users ON users.id = teams.owner_id ORDER BY teams.id DESC").all() });
  }
  if (!guard(res, actor, "team.own")) return;
  send(res, 200, { teams: db.prepare("SELECT * FROM teams WHERE owner_id = ?").all(actor.id) });
}

function createTeam(req, res, { actor, body }) {
  if (!guard(res, actor, "team.own")) return;
  if (db.prepare("SELECT id FROM teams WHERE owner_id = ?").get(actor.id)) return send(res, 409, { error: "taken" });
  const name = String(body.name || "").trim().slice(0, 40);
  const game = body.game === "valorant" ? "valorant" : "cod";
  if (name.length < 2) return send(res, 400, { error: "weak" });
  const created = db.prepare("INSERT INTO teams (name, game, owner_id, status, created_at) VALUES (?, ?, ?, 'pending', ?)").run(name, game, actor.id, new Date().toISOString());
  audit(actor.id, "team.create", name, game);
  send(res, 201, { id: created.lastInsertRowid });
}

function updateTeam(req, res, { actor, body, params }) {
  if (!actor) return send(res, 401, { error: "unauthorized" });
  const row = db.prepare("SELECT * FROM teams WHERE id = ?").get(Number(params.id));
  if (!row) return send(res, 404, { error: "not-found" });
  if (can(actor, "teams.manage") && body.status) {
    const status = ["approved", "rejected", "pending"].includes(body.status) ? body.status : row.status;
    db.prepare("UPDATE teams SET status = ? WHERE id = ?").run(status, row.id);
    audit(actor.id, "team.update", row.name, status);
    return send(res, 200, { ok: true });
  }
  if (row.owner_id !== actor.id || !can(actor, "team.own")) return send(res, 403, { error: "forbidden" });
  const name = String(body.name || row.name).trim().slice(0, 40);
  db.prepare("UPDATE teams SET name = ? WHERE id = ?").run(name, row.id);
  send(res, 200, { ok: true });
}

function listRegistrations(req, res, { actor }) {
  if (can(actor, "registrations.approve")) {
    return send(res, 200, {
      registrations: db.prepare(
        `SELECT registrations.*, teams.name AS team, tournaments.name AS tournament, tournaments.start_at
         FROM registrations JOIN teams ON teams.id = registrations.team_id
         JOIN tournaments ON tournaments.id = registrations.tournament_id ORDER BY registrations.id DESC`
      ).all(),
    });
  }
  if (!guard(res, actor, "tournaments.join")) return;
  send(res, 200, {
    registrations: db.prepare(
      `SELECT registrations.*, teams.name AS team, tournaments.name AS tournament, tournaments.start_at
       FROM registrations JOIN teams ON teams.id = registrations.team_id
       JOIN tournaments ON tournaments.id = registrations.tournament_id
       WHERE registrations.user_id = ? ORDER BY registrations.id DESC`
    ).all(actor.id),
  });
}

function createRegistration(req, res, { actor, body }) {
  if (!guard(res, actor, "tournaments.join")) return;
  const tournament = db.prepare("SELECT * FROM tournaments WHERE id = ?").get(Number(body.tournamentId));
  const team = db.prepare("SELECT * FROM teams WHERE id = ?").get(Number(body.teamId));
  if (!tournament || tournament.status !== "open" || !team || team.owner_id !== actor.id || team.status !== "approved") {
    return send(res, 403, { error: "forbidden" });
  }
  try {
    const created = db.prepare("INSERT INTO registrations (tournament_id, team_id, user_id, status) VALUES (?, ?, ?, 'pending')").run(tournament.id, team.id, actor.id);
    db.prepare("UPDATE tournaments SET seats = seats + 1 WHERE id = ?").run(tournament.id);
    audit(actor.id, "registration.create", tournament.name, team.name);
    send(res, 201, { id: created.lastInsertRowid });
  } catch {
    send(res, 409, { error: "taken" });
  }
}

function updateRegistration(req, res, { actor, body, params }) {
  if (!guard(res, actor, "registrations.approve")) return;
  const row = db.prepare("SELECT * FROM registrations WHERE id = ?").get(Number(params.id));
  if (!row) return send(res, 404, { error: "not-found" });
  const status = body.status === "rejected" ? "rejected" : "approved";
  if (row.status !== "rejected" && status === "rejected") db.prepare("UPDATE tournaments SET seats = CASE WHEN seats > 0 THEN seats - 1 ELSE 0 END WHERE id = ?").run(row.tournament_id);
  if (row.status === "rejected" && status !== "rejected") db.prepare("UPDATE tournaments SET seats = seats + 1 WHERE id = ?").run(row.tournament_id);
  db.prepare("UPDATE registrations SET status = ? WHERE id = ?").run(status, row.id);
  audit(actor.id, "registration.update", params.id, status);
  send(res, 200, { ok: true });
}

function deleteRegistration(req, res, { actor, params }) {
  if (!guard(res, actor, "tournaments.join")) return;
  const row = db.prepare("SELECT * FROM registrations WHERE id = ?").get(Number(params.id));
  if (!row || row.user_id !== actor.id) return send(res, 403, { error: "forbidden" });
  db.prepare("DELETE FROM registrations WHERE id = ?").run(row.id);
  if (row.status !== "rejected") db.prepare("UPDATE tournaments SET seats = CASE WHEN seats > 0 THEN seats - 1 ELSE 0 END WHERE id = ?").run(row.tournament_id);
  audit(actor.id, "registration.leave", String(row.tournament_id), String(row.team_id));
  send(res, 200, { ok: true });
}

function listAnnouncements(req, res, { actor }) {
  if (!actor) return send(res, 401, { error: "unauthorized" });
  send(res, 200, { announcements: db.prepare("SELECT * FROM announcements ORDER BY id DESC").all() });
}

function createAnnouncement(req, res, { actor, body }) {
  if (!guard(res, actor, "announcements.manage")) return;
  const title = String(body.title || "").trim().slice(0, 80);
  const text = String(body.body || "").trim().slice(0, 400);
  if (title.length < 2) return send(res, 400, { error: "weak" });
  const now = new Date().toISOString();
  const created = db.prepare("INSERT INTO announcements (title, body, author_id, created_at) VALUES (?, ?, ?, ?)").run(title, text, actor.id, now);
  const users = db.prepare("SELECT id FROM users WHERE status = 'active'").all();
  const note = db.prepare("INSERT INTO notifications (user_id, body, read, created_at) VALUES (?, ?, 0, ?)");
  users.forEach((user) => note.run(user.id, title, now));
  audit(actor.id, "announcement.create", title, "");
  send(res, 201, { id: created.lastInsertRowid });
}

function deleteAnnouncement(req, res, { actor, params }) {
  if (!guard(res, actor, "announcements.manage")) return;
  db.prepare("DELETE FROM announcements WHERE id = ?").run(Number(params.id));
  audit(actor.id, "announcement.delete", params.id, "");
  send(res, 200, { ok: true });
}

function sponsors(req, res, { actor, body, params }) {
  if (!guard(res, actor, "sponsors.manage")) return;
  if (req.method === "GET") return send(res, 200, { sponsors: db.prepare("SELECT * FROM sponsors ORDER BY id DESC").all() });
  if (req.method === "POST") {
    const name = String(body.name || "").trim().slice(0, 60);
    if (name.length < 2) return send(res, 400, { error: "weak" });
    const created = db.prepare("INSERT INTO sponsors (name, url, status) VALUES (?, ?, 'active')").run(name, String(body.url || "").slice(0, 160));
    audit(actor.id, "sponsor.create", name, "");
    return send(res, 201, { id: created.lastInsertRowid });
  }
  db.prepare("DELETE FROM sponsors WHERE id = ?").run(Number(params.id));
  audit(actor.id, "sponsor.delete", params.id, "");
  send(res, 200, { ok: true });
}

function settings(req, res, { actor, body }) {
  if (!guard(res, actor, "settings.manage")) return;
  if (req.method === "GET") return send(res, 200, { settings: db.prepare("SELECT key, value FROM settings").all() });
  Object.entries(body || {}).slice(0, 20).forEach(([key, value]) => {
    if (!/^[a-zA-Z]{2,24}$/.test(key)) return;
    db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, String(value).slice(0, 120));
  });
  audit(actor.id, "settings.update", "settings", Object.keys(body || {}).join(","));
  send(res, 200, { ok: true });
}

function database(req, res, { actor }) {
  if (!guard(res, actor, "database.view")) return;
  const tables = ["users", "roles", "permissions", "role_permissions", "tournaments", "matches", "teams", "registrations", "announcements", "sponsors", "settings", "comments", "notifications", "audit_logs"];
  send(res, 200, { tables: tables.map((name) => ({ name, rows: db.prepare(`SELECT COUNT(*) AS n FROM ${name}`).get().n })) });
}

function logs(req, res, { actor }) {
  if (!guard(res, actor, "logs.view")) return;
  send(res, 200, {
    logs: db.prepare(
      `SELECT audit_logs.*, users.email FROM audit_logs LEFT JOIN users ON users.id = audit_logs.user_id ORDER BY audit_logs.id DESC LIMIT 80`
    ).all(),
  });
}

function createSupport(req, res, { body }) {
  const name = String(body.name || "").trim().slice(0, 60);
  const email = String(body.email || "").trim().slice(0, 80);
  const message = String(body.message || "").trim().slice(0, 500);
  if (name.length < 2 || !email.includes("@") || message.length < 2) return send(res, 400, { error: "weak" });
  db.prepare("INSERT INTO comments (user_id, body, status, created_at) VALUES (?, ?, 'visible', ?)").run(
    null,
    `${name} <${email}>: ${message}`,
    new Date().toISOString()
  );
  send(res, 201, { ok: true });
}

function comments(req, res, { actor, body, params }) {
  if (!guard(res, actor, "chat.moderate")) return;
  if (req.method === "GET") return send(res, 200, { comments: db.prepare("SELECT comments.*, users.email FROM comments LEFT JOIN users ON users.id = comments.user_id ORDER BY comments.id DESC").all() });
  const status = body.status === "hidden" ? "hidden" : "visible";
  db.prepare("UPDATE comments SET status = ? WHERE id = ?").run(status, Number(params.id));
  audit(actor.id, "comment.moderate", params.id, status);
  send(res, 200, { ok: true });
}

function notifications(req, res, { actor }) {
  if (!guard(res, actor, "notifications.view")) return;
  send(res, 200, { notifications: db.prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC").all(actor.id) });
}

function profile(req, res, { actor, body }) {
  if (!guard(res, actor, "profile.edit")) return;
  const name = String(body.name || actor.name).trim().slice(0, 60);
  if (body.password) {
    if (String(body.password).length < 8) return send(res, 400, { error: "weak" });
    db.prepare("UPDATE users SET name = ?, password_hash = ?, updated_at = ? WHERE id = ?").run(name, hashPassword(String(body.password)), new Date().toISOString(), actor.id);
  } else {
    db.prepare("UPDATE users SET name = ?, updated_at = ? WHERE id = ?").run(name, new Date().toISOString(), actor.id);
  }
  audit(actor.id, "profile.update", actor.email, "");
  send(res, 200, { ok: true, name });
}

function stats(req, res, { actor }) {
  if (!actor) return send(res, 401, { error: "unauthorized" });
  if (!can(actor, "stats.view") && !can(actor, "analytics.view")) return send(res, 403, { error: "forbidden" });
  const payload = {
    tournaments: db.prepare("SELECT COUNT(*) AS n FROM tournaments").get().n,
    matches: db.prepare("SELECT COUNT(*) AS n FROM matches").get().n,
    teams: db.prepare("SELECT COUNT(*) AS n FROM teams").get().n,
    pending: db.prepare("SELECT COUNT(*) AS n FROM tournaments WHERE status IN ('pending', 'draft')").get().n,
  };
  if (can(actor, "analytics.view")) {
    payload.users = db.prepare("SELECT COUNT(*) AS n FROM users").get().n;
    payload.byRole = db.prepare("SELECT roles.key AS role, COUNT(users.id) AS n FROM roles LEFT JOIN users ON users.role_id = roles.id GROUP BY roles.id").all();
    payload.games = db.prepare("SELECT game, COUNT(*) AS n FROM tournaments GROUP BY game").all();
  }
  send(res, 200, payload);
}

function history(req, res, { actor }) {
  if (!guard(res, actor, "history.view")) return;
  send(res, 200, {
    history: db.prepare(
      `SELECT registrations.status, tournaments.name, tournaments.game, tournaments.start_at
       FROM registrations JOIN tournaments ON tournaments.id = registrations.tournament_id
       WHERE registrations.user_id = ? ORDER BY registrations.id DESC`
    ).all(actor.id),
  });
}

function standings(req, res, { actor }) {
  if (!guard(res, actor, "standings.view")) return;
  const matches = db.prepare("SELECT team_a, team_b, score_a, score_b, status FROM matches WHERE status = 'finished'").all();
  const table = new Map();
  matches.forEach((match) => {
    [match.team_a, match.team_b].forEach((name) => { if (!table.has(name)) table.set(name, { name, wins: 0, losses: 0 }); });
    if (match.score_a == null || match.score_b == null) return;
    if (match.score_a === match.score_b) return;
    const winner = match.score_a > match.score_b ? match.team_a : match.team_b;
    const loser = winner === match.team_a ? match.team_b : match.team_a;
    table.get(winner).wins += 1;
    table.get(loser).losses += 1;
  });
  send(res, 200, { standings: [...table.values()].sort((a, b) => b.wins - a.wins) });
}

const routes = [
  ["POST", "/api/auth/login", login],
  ["POST", "/api/auth/register", register],
  ["GET", "/api/auth/me", me],
  ["GET", "/api/users", listUsers],
  ["POST", "/api/users", createUser],
  ["PATCH", "/api/users/:id", updateUser],
  ["DELETE", "/api/users/:id", deleteUser],
  ["GET", "/api/roles", listRoles],
  ["GET", "/api/public/tournaments", listPublicTournaments],
  ["GET", "/api/public/matches", listPublicMatches],
  ["GET", "/api/tournaments", listTournaments],
  ["POST", "/api/tournaments", createTournament],
  ["PATCH", "/api/tournaments/:id", updateTournament],
  ["DELETE", "/api/tournaments/:id", deleteTournament],
  ["POST", "/api/tournaments/:id/decision", decideTournament],
  ["GET", "/api/matches", listMatches],
  ["POST", "/api/matches", createMatch],
  ["PATCH", "/api/matches/:id", updateMatch],
  ["DELETE", "/api/matches/:id", deleteMatch],
  ["GET", "/api/teams", listTeams],
  ["POST", "/api/teams", createTeam],
  ["PATCH", "/api/teams/:id", updateTeam],
  ["GET", "/api/registrations", listRegistrations],
  ["POST", "/api/registrations", createRegistration],
  ["PATCH", "/api/registrations/:id", updateRegistration],
  ["DELETE", "/api/registrations/:id", deleteRegistration],
  ["GET", "/api/announcements", listAnnouncements],
  ["POST", "/api/announcements", createAnnouncement],
  ["DELETE", "/api/announcements/:id", deleteAnnouncement],
  ["GET", "/api/sponsors", sponsors],
  ["POST", "/api/sponsors", sponsors],
  ["DELETE", "/api/sponsors/:id", sponsors],
  ["GET", "/api/settings", settings],
  ["PATCH", "/api/settings", settings],
  ["GET", "/api/database", database],
  ["GET", "/api/logs", logs],
  ["POST", "/api/support", createSupport],
  ["GET", "/api/comments", comments],
  ["PATCH", "/api/comments/:id", comments],
  ["GET", "/api/notifications", notifications],
  ["PATCH", "/api/profile", profile],
  ["GET", "/api/stats", stats],
  ["GET", "/api/history", history],
  ["GET", "/api/standings", standings],
];

module.exports = { handleApi };
