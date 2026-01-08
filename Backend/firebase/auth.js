const admin = require("./firebase");

const decodeAuthToken = async (token) => {
  if (!token) return null;
  try {
    const decodeValue = await admin.auth().verifyIdToken(token);
    if (decodeValue) {
      console.log("Token decoded successfully:", decodeValue.email);
      return decodeValue.email;
    }
    console.log("Token decoding returned null/false");
    return null;
  } catch (e) {
    console.error("Token decoding failed:", e);
    return null;
  }
};

const verifyTokenMiddleware = async (req, res, next) => {
  try {
    const h = req.headers.authorization;
    if (!h?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }
    const token = h.split(" ")[1];
    req.user = await admin.auth().verifyIdToken(token);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = {
  verifyTokenMiddleware,
  decodeAuthToken,
};
