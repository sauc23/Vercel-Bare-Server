const http = require("node:http");
const { createBareServer } = require("@tomphttp/bare-server-node");
const os = require("os");
const pidusage = require("pidusage");
const fs = require("fs");
const path = require("path");
const bytes = require("bytes");

// Create an HTTP server
const httpServer = http.createServer();
const bareServer = createBareServer("/bare/");

// Track totalBytesSent globally
let totalBytesSent = 0;

httpServer.on("request", async (req, res) => {
  if (req.url === "/stats") {
    try {
      // Gather system-related information
      const memoryUsage = os.totalmem() - os.freemem();
      const cpuUsage = await getCpuUsage();
      const bandwidthUsage = bytes(totalBytesSent); // Convert totalBytesSent to a human-readable format

      // Create a JSON response
      const jsonResponse = {
        memoryUsage: formatBytes(memoryUsage),
        cpuUsage: `${cpuUsage}%`,
        bandwidthUsage: bandwidthUsage,
      };

      // Send JSON response
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(jsonResponse));
    } catch (error) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    }
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
  } else if (bareServer.shouldRoute(req)) {
    bareServer.routeRequest(req, res);
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

// Interceptor for tracking totalBytesSent
httpServer.on('response', (req, res) => {
  res.on('finish', () => {
    totalBytesSent += res.getHeader('content-length') || 0;
  });
});
