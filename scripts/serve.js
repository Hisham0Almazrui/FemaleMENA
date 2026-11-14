const http = require("http");
const fs = require("fs");
const path = require("path");
const { handleApi } = require("../server/routes");

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
};
const root = path.resolve(__dirname, "..");

http
  .createServer(async (req, res) => {
    if (await handleApi(req, res)) return;
    let urlPath = decodeURIComponent(req.url.split("?")[0]);
    if (urlPath === "/") urlPath = "/index.html";
    const file = path.join(root, urlPath);
    if (!file.startsWith(root)) {
      res.writeHead(403);
      return res.end();
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end("not found");
      }
      const headers = { "Content-Type": types[path.extname(file)] || "application/octet-stream" };
      if (file.includes(`${path.sep}media${path.sep}cups${path.sep}`)) headers["Cache-Control"] = "no-cache";
      res.writeHead(200, headers);
      res.end(data);
    });
  })
  .listen(8765, () => console.log("ready"));
