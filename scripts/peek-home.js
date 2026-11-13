const fs = require("fs");
const s = fs.readFileSync(process.env.TEMP + "/mh-home.html", "utf8");
const imgs = [...s.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]);
console.log("imgs", imgs.slice(0, 30));
console.log("count", imgs.length);
const i = s.indexOf("اللعب يجمعنا");
console.log(s.slice(i, i + 400));
