// requestLogger logs every request with method, path, status, and latency.
function requestLogger(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const latencyMs = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${latencyMs}ms`
    );
  });

  next();
}

module.exports = { requestLogger };
