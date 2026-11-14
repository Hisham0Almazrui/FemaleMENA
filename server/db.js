const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const { hashPassword } = require("./auth");

const dbPath = path.join(__dirname, "..", "data", "platform.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  rank INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  area TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  PRIMARY KEY (role_id, permission_id)
);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS tournaments (
  id INTEGER PRIMARY KEY,
  game TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  summary TEXT,
  start_at TEXT,
  seats INTEGER DEFAULT 0,
  cap INTEGER DEFAULT 16,
  created_by INTEGER,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY,
  tournament_id INTEGER NOT NULL,
  round TEXT,
  team_a TEXT,
  team_b TEXT,
  score_a INTEGER,
  score_b INTEGER,
  status TEXT NOT NULL DEFAULT 'scheduled'
);
CREATE TABLE IF NOT EXISTS teams (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  game TEXT NOT NULL,
  owner_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS registrations (
  id INTEGER PRIMARY KEY,
  tournament_id INTEGER NOT NULL,
  team_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  UNIQUE (tournament_id, team_id)
);
CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  author_id INTEGER,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sponsors (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT,
  status TEXT NOT NULL DEFAULT 'active'
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'visible',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  body TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  action TEXT NOT NULL,
  target TEXT,
  detail TEXT,
  created_at TEXT NOT NULL
);
`);

const PERMISSIONS = [
  ["users.manage", "Manage users and admins", "owner"],
  ["roles.manage", "Manage roles and permissions", "owner"],
  ["analytics.view", "View platform analytics", "owner"],
  ["settings.manage", "Manage site settings", "owner"],
  ["sponsors.manage", "Manage sponsors and partners", "owner"],
  ["database.view", "View database summary", "owner"],
  ["logs.view", "View audit logs", "owner"],
  ["tournaments.approve", "Approve or reject tournaments", "owner"],
  ["tournaments.manage", "Create, edit, and delete tournaments", "staff"],
  ["matches.manage", "Create, edit, and delete matches", "staff"],
  ["teams.manage", "Manage teams and players", "staff"],
  ["registrations.approve", "Approve team registrations", "staff"],
  ["results.update", "Update match results", "staff"],
  ["brackets.manage", "Manage brackets", "staff"],
  ["announcements.manage", "Manage announcements", "staff"],
  ["chat.moderate", "Moderate chats and comments", "staff"],
  ["stats.view", "View tournament statistics", "staff"],
  ["tournaments.view", "View tournaments", "public"],
  ["matches.view", "View match schedule", "public"],
  ["standings.view", "View standings", "public"],
  ["tournaments.join", "Join an open tournament", "public"],
  ["team.own", "Create and manage own team", "public"],
  ["profile.edit", "Edit personal profile", "public"],
  ["notifications.view", "Receive notifications", "public"],
  ["history.view", "View tournament history", "public"],
];

const ROLE_KEYS = {
  owner: PERMISSIONS.map(([key]) => key),
  admin: PERMISSIONS.filter(([, , area]) => area === "staff" || area === "public").map(([key]) => key),
  visitor: PERMISSIONS.filter(([, , area]) => area === "public").map(([key]) => key),
};

function seed() {
  const now = new Date().toISOString();
  const insertRole = db.prepare("INSERT INTO roles (key, name, rank) VALUES (?, ?, ?)");
  insertRole.run("owner", "Owner", 100);
  insertRole.run("admin", "Admin", 50);
  insertRole.run("visitor", "Visitor", 10);
  const insertPerm = db.prepare("INSERT INTO permissions (key, label, area) VALUES (?, ?, ?)");
  PERMISSIONS.forEach((row) => insertPerm.run(...row));
  const roleId = Object.fromEntries(db.prepare("SELECT id, key FROM roles").all().map((row) => [row.key, row.id]));
  const permId = Object.fromEntries(db.prepare("SELECT id, key FROM permissions").all().map((row) => [row.key, row.id]));
  const link = db.prepare("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)");
  Object.entries(ROLE_KEYS).forEach(([role, keys]) => keys.forEach((key) => link.run(roleId[role], permId[key])));
  const insertUser = db.prepare(
    "INSERT INTO users (email, name, password_hash, role_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'active', ?, ?)"
  );
  insertUser.run("owner@femalemena.com", "Owner", hashPassword("OwnerMena#2026"), roleId.owner, now, now);
  insertUser.run("admin@femalemena.com", "Admin", hashPassword("FemaleMena#2026"), roleId.admin, now, now);
  const visitor = insertUser.run("visitor@femalemena.com", "Visitor", hashPassword("VisitorMena#2026"), roleId.visitor, now, now);
  const ownerId = db.prepare("SELECT id FROM users WHERE email = ?").get("owner@femalemena.com").id;
  db.prepare(
    "INSERT INTO tournaments (game, name, status, summary, start_at, seats, cap, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run("cod", "Night Cup", "pending", "Call of Duty cup waiting for owner approval.", "20 نوفمبر 2026", 0, 32, ownerId, now);
  const cup = db.prepare(
    "INSERT INTO tournaments (game, name, status, summary, start_at, seats, cap, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run("valorant", "Valorant Open", "open", "Open Valorant registration for Female MENA.", "22 نوفمبر 2026", 1, 16, ownerId, now);
  const team = db.prepare("INSERT INTO teams (name, game, owner_id, status, created_at) VALUES (?, ?, ?, 'approved', ?)").run(
    "Visitor Unit",
    "valorant",
    visitor.lastInsertRowid,
    now
  );
  db.prepare("INSERT INTO registrations (tournament_id, team_id, user_id, status) VALUES (?, ?, ?, 'approved')").run(
    cup.lastInsertRowid,
    team.lastInsertRowid,
    visitor.lastInsertRowid
  );
  db.prepare("INSERT INTO matches (tournament_id, round, team_a, team_b, score_a, score_b, status) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    cup.lastInsertRowid,
    "Opening",
    "Visitor Unit",
    "TBD",
    null,
    null,
    "scheduled"
  );
  db.prepare("INSERT INTO announcements (title, body, author_id, created_at) VALUES (?, ?, ?, ?)").run(
    "Season open",
    "Registration is open for the Valorant cup.",
    ownerId,
    now
  );
  db.prepare("INSERT INTO sponsors (name, url, status) VALUES (?, ?, 'active')").run("Female MENA", "https://femalemena.local");
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run("siteName", "Female MENA");
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run("registration", "open");
  db.prepare("INSERT INTO comments (user_id, body, status, created_at) VALUES (?, ?, 'visible', ?)").run(
    visitor.lastInsertRowid,
    "Ready for the next map.",
    now
  );
  db.prepare("INSERT INTO notifications (user_id, body, read, created_at) VALUES (?, ?, 0, ?)").run(
    visitor.lastInsertRowid,
    "Your team Visitor Unit was approved.",
    now
  );
  db.prepare("INSERT INTO audit_logs (user_id, action, target, detail, created_at) VALUES (?, 'seed', 'platform', 'Initial accounts created', ?)").run(
    ownerId,
    now
  );
}

function ensureColumn(table, name, type) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((col) => col.name === name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${type}`);
}
ensureColumn("tournaments", "end_at", "TEXT");
ensureColumn("tournaments", "details", "TEXT");

if (!db.prepare("SELECT id FROM roles LIMIT 1").get()) seed();

function audit(userId, action, target, detail) {
  db.prepare("INSERT INTO audit_logs (user_id, action, target, detail, created_at) VALUES (?, ?, ?, ?, ?)").run(
    userId || null,
    action,
    target || "",
    detail || "",
    new Date().toISOString()
  );
}

function permissionsFor(roleId, roleKey) {
  if (roleKey === "owner") return PERMISSIONS.map(([key]) => key);
  return db
    .prepare(
      `SELECT permissions.key FROM role_permissions
       JOIN permissions ON permissions.id = role_permissions.permission_id
       WHERE role_permissions.role_id = ?`
    )
    .all(roleId)
    .map((row) => row.key);
}

module.exports = { db, audit, permissionsFor, PERMISSIONS };
