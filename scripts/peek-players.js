const fs = require("fs");
const s = fs.readFileSync(process.env.TEMP + "/mh-players.html", "utf8");
const i = s.indexOf("eclw");
console.log("idx", i);
console.log(s.slice(i - 500, i + 800));
const classes = ["pb-row", "lb-row", "pl-row", "rb-row", "player-row"];
for (const c of classes) console.log(c, s.split(c).length - 1);
