const http = require("node:http");
const { createBareServer } = require("@tomphttp/bare-server-node");
const fs = require("fs");
const path = require("path");
const os = require("os");
const pidusage = require("pidusage");

// Create an HTTP server
const httpServer = http.createServer();
const bareServer = createBareServer("/bare/");

httpServer.on("request", async (req, res) => {
  if (req.url === "/stats") {
    // Serve the stats page when the "/stats" URL is requested
    const statsPagePath = path.join(__dirname, "stats.html");

    fs.readFile(statsPagePath, "utf8", (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      } else {
        // Gather system-related information
        const memoryUsage = os.totalmem() - os.freemem();
        const cpuUsage = await getCpuUsage();
        const bandwidthUsage = "Calculate bandwidth usage here";

        // Replace placeholders in the HTML with actual values
        data = data.replace("{MEMORY_USAGE}", formatBytes(memoryUsage));
        data = data.replace("{CPU_USAGE}", `${cpuUsage}%`);
        data = data.replace("{BANDWIDTH_USAGE}", bandwidthUsage);

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(data);
      }
    });
  } else if (bareServer.shouldRoute(req)) {
    bareServer.routeRequest(req, res);
  } else if (req.url === "/") {
    // Serve the index.html file when the root URL is requested
    const indexPath = path.join(__dirname, "index.html");

    fs.readFile(indexPath, "utf8", (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      } else {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(data);
      }
    });
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found.");
  }
});

httpServer.on("upgrade", (req, socket, head) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeUpgrade(req, socket, head);
  } else {
    socket.end();
  }
});

httpServer.on("listening", () => {
  console.log("HTTP server listening");
});

httpServer.listen({
  port: 8000,
});

async function getCpuUsage() {
  return new Promise((resolve) => {
    pidusage(process.pid, (err, stats) => {
      if (err) {
        resolve(0);
      } else {
        resolve(stats.cpu.toFixed(2));
      }
    });
  });
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
