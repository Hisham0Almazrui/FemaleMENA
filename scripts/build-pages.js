const fs = require("fs");
const teams = fs.readFileSync("data/teams.json", "utf8");
const players = fs.readFileSync("data/players.json", "utf8");
fs.mkdirSync("js", { recursive: true });
fs.writeFileSync("js/data.js", "window.MH_TEAMS=" + teams + ";\nwindow.MH_PLAYERS=" + players + ";\n");

const pages = [
  ["index", "Female MENA", "home"],
  ["leaderboards", "التصنيفات", "leaderboards"],
  ["players", "تصنيف اللاعبين", "players"],
  ["rules", "نظام نقاط التصنيف", "rules"],
  ["tournaments", "البطولات", "tournaments"],
  ["matches", "المباريات المباشرة", "matches"],
  ["leagues", "الدوريات", "leagues"],
  ["support", "الدعم", "support"],
  ["start", "كيف تبدأ", "start"],
  ["terms", "الشروط", "terms"],
  ["privacy", "الخصوصية", "privacy"],
  ["cookies", "ملفات الارتباط", "cookies"],
  ["admin", "Female MENA", "admin"],
  ["account", "الحساب", "account"],
];

const html = (title, page) => `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="theme-color" content="#0C0C0D"/>
${page === "admin" ? '<meta name="robots" content="noindex, nofollow"/>' : ""}
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="css/site.css?v=59"/>
</head>
<body data-page="${page}">
<script src="js/data.js?v=59"></script>
<script src="js/when.js?v=59"></script>
<script src="js/account.js?v=59"></script>
<script src="js/app.js?v=59"></script>
</body>
</html>
`;

for (const [file, title, page] of pages) fs.writeFileSync(file + ".html", html(title, page));
console.log("pages", pages.length);
