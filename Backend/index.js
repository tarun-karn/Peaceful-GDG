const allowedOrigins = [
  "https://peaceful-gdg.vercel.app"
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );

  // 🔴 HANDLE PREFLIGHT
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

/* ================== ROUTES ================== */
// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    status: "Backend is active",
    dbInitialized: isInitialized,
  });
});

// 🔴 IMPORTANT: prefix routes with /api
app.use("/api", router);

/* ================== EXPORT ================== */
module.exports = app;
