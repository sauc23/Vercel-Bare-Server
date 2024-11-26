
const http = require("node:http");
const { createBareServer } = require("@tomphttp/bare-server-node");
const fs = require("fs");
const path = require("path");

// Create an HTTP server
const httpServer = http.createServer();
const bareServer = createBareServer("/bare/");

httpServer.on("request", (req, res) => {
  if (bareServer.shouldRoute(req)) {
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
    res.writeHead(400, { "Content-Type": "text/plain" });
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
