const authService = require("../services/authService");
const prisma = require("../lib/prisma");
const { parsePagination, paginationMeta } = require("../lib/pagination");

const VALID_ROLES = ["ADMIN", "SALESMAN", "OWNER"];

async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "email and password are required" });
  }

  try {
    const result = await authService.login(email, password);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(401).json({ success: false, message: err.message });
  }
}

// createUser handles POST /api/v1/qr-reviews/auth/users — admin-only account creation.
async function createUser(req, res) {
  const { email, password, name, role } = req.body || {};
  if (!email || !password || !role) {
    return res.status(400).json({ success: false, message: "email, password, and role are required" });
  }
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ success: false, message: `role must be one of: ${VALID_ROLES.join(", ")}` });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: "password must be at least 8 characters" });
  }

  try {
    const user = await authService.createUser({ email, password, name, role });
    res.status(201).json({ success: true, data: user, message: "User created successfully" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

// listUsers handles GET /api/v1/qr-reviews/auth/users — admin-only account listing.
async function listUsers(req, res) {
  try {
    const { page, limit, skip } = parsePagination(req.query);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
        skip,
        take: limit,
      }),
      prisma.user.count(),
    ]);

    res.status(200).json({ success: true, data: users, meta: paginationMeta(page, limit, total) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function me(req, res) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({
      success: true,
      data: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { login, createUser, listUsers, me };
