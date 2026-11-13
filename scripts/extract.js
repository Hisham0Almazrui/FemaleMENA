const fs = require("fs");
const path = require("path");
const htmlPath = path.join(process.env.TEMP, "mh-lb.html");
const s = fs.readFileSync(htmlPath, "utf8");

function text(html) {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
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
console.log("row markers", positions.length);
positions.slice(0, 6).forEach((p, i) => console.log(i, JSON.stringify(s.slice(p, p + 90))));
console.log("with rank", positions.filter((p) => s.slice(p, p + 80).includes("data-rank")).length);
const teams = [];
for (let n = 0; n < positions.length; n++) {
  const end = positions[n + 1] || Math.min(s.length, positions[n] + 20000);
  const row = s.slice(positions[n], end);
  const attr = (name) => {
    const a = row.match(new RegExp(name + '="([^"]*)"'));
    return a ? a[1] : "";
  };
  const rank = attr("data-rank") || ((row.match(/class="rb-rank">([^<]*)</) || [, ""])[1].trim());
  if (!rank || rank === "المركز") continue;
  const crest = (row.match(/class="crest-text"[^>]*>([^<]*)</) || [, ""])[1].trim();
  const name = (row.match(/class="rb-name"><a[^>]*>([^<]*)</) || [, ""])[1].trim();
  const subHtml = (row.match(/class="rb-sub">([\s\S]*?)<\/small>/) || [, ""])[1];
  const zoneLabel = (row.match(/class="rb-zone"[^>]*>([^<]*)</) || [, ""])[1].trim();
  const points = +((row.match(/class="rb-points"><strong>([^<]*)</) || [, "0"])[1]);
  const stat = (k) => {
    const block = row.match(new RegExp('data-k="' + k + '"[\\s\\S]{0,500}?class="rb-value"([^>]*)>([\\s\\S]*?)</span>'));
    if (!block) return { v: "", tier: "", sign: "" };
    const tier = (block[1].match(/data-tier="([^"]*)"/) || [, ""])[1];
    const sign = (block[1].match(/data-sign="([^"]*)"/) || [, ""])[1];
    return { v: text(block[2]), tier, sign };
  };
  const scoreBlock = (row.match(/data-k="score" class="rb-stat">([\s\S]*?)<\/span><\/span>/) || [, ""])[1];
  const split = text((scoreBlock.match(/class="rb-split">([\s\S]*?)<\/small>/) || [, ""])[1]);
  const form = [...row.matchAll(/class="rb-form"[\s\S]*?<\/span>/g)][0];
  const marks = form ? [...form[0].matchAll(/data-mark="([WL])"/g)].map((x) => x[1]) : [];
  const roster = [...row.matchAll(/class="rb-roster">([\s\S]*?)<\/ul>/g)][0];
  const players = [];
  if (roster) {
    for (const li of roster[1].matchAll(/<li>([\s\S]*?)<\/li>/g)) {
      const pname = text((li[1].match(/<bdi[^>]*>([^<]*)/) || [, ""])[1]);
      const pts = text((li[1].match(/<b>([\s\S]*?)<\/b>/) || [, ""])[1]).replace(/\s/g, "");
      if (pname) players.push({ name: pname, points: pts });
    }
  }
  teams.push({
    rank: +rank,
    zone: attr("data-zone"),
    crest,
    name,
    sub: text(subHtml),
    zoneLabel,
    points,
    best: stat("best").v,
    tier: stat("best").tier,
    events: +stat("events").v || 0,
    titles: +stat("titles").v || 0,
    played: +stat("played").v || 0,
    wins: +stat("wins").v || 0,
    losses: +stat("losses").v || 0,
    rate: stat("rate").v,
    diff: stat("score").v,
    sign: stat("score").sign,
    split,
    form: marks,
    players,
  });
}

const out = path.join("c:/Users/en-5/Desktop/TRK", "data");
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "teams.json"), JSON.stringify(teams, null, 2));
console.log("teams", teams.length, teams[0] && teams[0].name, teams.at(-1) && teams.at(-1).name);
