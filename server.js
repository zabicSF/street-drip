// server.js
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors")

const app = express();

app.use(cors());
app.use(express.json());

app.use(
  "/create-payment",
  createProxyMiddleware({
    target: "http://localhost:4000",
    changeOrigin: true,
    pathRewrite: (path, req) => path.replace(/^\/create-payment/, "/api/create-payment"),
    onError(err, req, res) {
      console.error('Proxy error:', err);
      res.status(500).send('Proxy error');
    },
    logLevel: 'debug',
  })
);

app.use(express.static("frontend/build"));

// Serve index.html for all unknown routes (for React Router)
const path = require("path");
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "frontend", "build", "index.html"));
});

app.listen(3000, () => {
  console.log("🚀 Proxy running on http://localhost:3000");
});
