const fs = require("fs");
const path = require("path");
const s = fs.readFileSync(process.env.TEMP + "/mh-players.html", "utf8");

function text(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

const marker = 'class="rb-row"';
const positions = [];
let from = 0;
while (true) {
  const i = s.indexOf(marker, from);
  if (i < 0) break;
  positions.push(i);
  from = i + marker.length;
}

const players = [];
for (let n = 0; n < positions.length; n++) {
  const end = positions[n + 1] || Math.min(s.length, positions[n] + 12000);
  const row = s.slice(positions[n], end);
  if (!row.includes('data-k="player"')) continue;
  const rank = (row.match(/class="rb-rank">([^<]*)</) || [, ""])[1].trim();
  const name = (row.match(/<bdi[^>]*>([^<]*)</) || [, ""])[1].trim();
  const avatar = (row.match(/<img src="([^"]+)"/) || [, ""])[1];
  const sub = text((row.match(/class="rb-sub">([\s\S]*?)<\/small>/) || [, ""])[1]);
  const points = +((row.match(/class="rb-points"><strong>([^<]*)</) || [, "0"])[1]);
  const titles = +((row.match(/data-k="titles"[\s\S]{0,300}?class="rb-value"[^>]*>([^<]*)</) || [, "0"])[1]);
  const team = (row.match(/data-k="team"[\s\S]{0,500}?href="[^"]*"[^>]*>([\s\S]*?)<\/a>/) || [, ""])[1];
  const teamName = text(team);
  const best = text((row.match(/data-k="best"[\s\S]{0,300}?class="rb-value"[^>]*>([^<]*)</) || [, ""])[1]);
  const events = +((row.match(/data-k="events"[\s\S]{0,300}?class="rb-value"[^>]*>([^<]*)</) || [, "0"])[1]);
  if (!name) continue;
  players.push({ rank: +rank, name, avatar, sub, points, titles, team: teamName, best, events });
}

const out = path.join("c:/Users/en-5/Desktop/TRK/data/players.json");
fs.writeFileSync(out, JSON.stringify(players, null, 2));
console.log("players", players.length, players[0], players[4]);
