const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../lib/db");
const config = require("../config/config");

const SALT_ROUNDS = 10;

// createUser creates a new user account with the given role. Only callable by an admin.
async function createUser({ email, password, name, role }) {
  const [existingRows] = await db.query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
  if (existingRows.length > 0) {
    throw new Error("A user with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const id = crypto.randomUUID();

  await db.query(
    "INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)",
    [id, email, passwordHash, name || "", role]
  );

  const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
  return toUserResponse(rows[0]);
}

// login verifies credentials and returns a signed JWT plus the user profile.
async function login(email, password) {
  const [rows] = await db.query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
  const user = rows[0];
  if (!user) {
    throw new Error("Invalid email or password");
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new Error("Invalid email or password");
  }

  const token = jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

  return { token, user: toUserResponse(user) };
}

function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

// changePassword verifies the current password before setting a new one.
async function changePassword(userId, currentPassword, newPassword) {
  const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
  const user = rows[0];
  if (!user) {
    throw new Error("User not found");
  }

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) {
    throw new Error("Current password is incorrect");
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await db.query("UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, userId]);
}

function toUserResponse(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    created_at: user.created_at,
  };
}

module.exports = { createUser, login, verifyToken, changePassword };
