const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Use environment variable
const SECRET = process.env.JWT_SECRET;

// Dummy users (in-memory)
const users = [
  { email: "admin@test.com", password: "123456", role: "admin" },
  { email: "user@test.com", password: "123456", role: "user" }
];

// 🔹 Register (auto-login)
app.post("/register", (req, res) => {
  const { email, password } = req.body;

  const exists = users.find((u) => u.email === email);
  if (exists) return res.status(400).send("User already exists");

  const newUser = { email, password, role: "user" };
  users.push(newUser);

  const token = jwt.sign(newUser, SECRET, { expiresIn: "1h" });

  res.json({ token });
});

// 🔐 Verify Token
function verifyToken(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).send("No token");

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).send("Invalid token");
  }
}

// 👑 Role-based Access Control
function authorizeRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role)
      return res.status(403).send("Access denied");
    next();
  };
}

// 🔑 Login
app.post("/login", (req, res) => {
  const user = users.find(
    (u) => u.email === req.body.email && u.password === req.body.password
  );

  if (!user) return res.status(401).send("Invalid credentials");

  const token = jwt.sign(user, SECRET, { expiresIn: "1h" });
  res.json({ token });
});

// 🔒 Protected Routes
app.get("/dashboard", verifyToken, (req, res) => {
  res.json(req.user);
});

app.get("/admin", verifyToken, authorizeRole("admin"), (req, res) => {
  res.send("Admin data");
});

app.get("/user", verifyToken, authorizeRole("user"), (req, res) => {
  res.send("User data");
});

// ✅ Use Render PORT
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));