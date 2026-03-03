const express = require("express");
const { Pool } = require("pg");
const rateLimit = require("express-rate-limit");

const app = express();
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST || "db",
  port: 5432,
  user: process.env.DB_USER || "admin",
  password: process.env.DB_PASSWORD || "12341234$$Catch22%Youppi!",
  database: process.env.DB_NAME || "userdb",
});

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// Rate limiter for POST: 5 requests per minute per IP
const postLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: "Too many requests. Try again in a minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

// GET /api/users — list all users
app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, user_group, created_at FROM users ORDER BY id"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching users:", err.message);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// POST /api/users — add a new user (password-protected + rate-limited)
app.post("/api/users", postLimiter, async (req, res) => {
  const { username, user_group, password } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Invalid admin password" });
  }

  if (!username || !user_group) {
    return res.status(400).json({ error: "Username and group are required" });
  }

  const validGroups = ["user", "admin", "superadmin"];
  if (!validGroups.includes(user_group)) {
    return res.status(400).json({ error: "Invalid group" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO users (username, user_group) VALUES ($1, $2) RETURNING id, username, user_group, created_at",
      [username, user_group]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Username already exists" });
    }
    console.error("Error creating user:", err.message);
    res.status(500).json({ error: "Failed to create user" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend API running on port ${PORT}`);
});
