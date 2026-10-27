require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { MongoClient, ObjectId } = require("mongodb");

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
const DB_NAME = process.env.DB_NAME || "studentPortal";
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(MONGO_URI);
let users;
let students;

// ---------- helpers ----------
const isValidId = (id) => ObjectId.isValid(id);
const isEmail = (s) => typeof s === "string" && /^\S+@\S+\.\S+$/.test(s);

function cleanStudent(body) {
  const { name, prn, email, course, year, division, phone } = body || {};
  return {
    name: String(name || "").trim(),
    prn: String(prn || "").trim(),
    email: String(email || "").trim().toLowerCase(),
    course: String(course || "").trim(),
    year: String(year || "").trim(),
    division: String(division || "").trim(),
    phone: String(phone || "").trim(),
  };
}

function validateStudent(s) {
  if (!s.name) return "Name is required";
  if (!s.prn) return "PRN is required";
  if (!isEmail(s.email)) return "A valid email is required";
  if (!s.course) return "Course is required";
  return null;
}

// ---------- auth middleware ----------
function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ msg: "Login required" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ msg: "Session expired, please login again" });
  }
}

// ---------- health ----------
app.get("/", (req, res) => res.json({ msg: "Student Portal API is running" }));

// ---------- auth routes ----------
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !String(name).trim()) return res.status(400).json({ msg: "Name is required" });
    if (!isEmail(email)) return res.status(400).json({ msg: "A valid email is required" });
    if (!password || String(password).length < 6)
      return res.status(400).json({ msg: "Password must be at least 6 characters" });

    const cleanEmail = email.trim().toLowerCase();
    const exists = await users.findOne({ email: cleanEmail });
    if (exists) return res.status(409).json({ msg: "This email is already registered" });

    const hashed = await bcrypt.hash(String(password), 10);
    await users.insertOne({
      name: String(name).trim(),
      email: cleanEmail,
      password: hashed,
      createdAt: new Date(),
    });
    res.status(201).json({ msg: "Account created. Please login." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!isEmail(email) || !password)
      return res.status(400).json({ msg: "Email and password are required" });

    const user = await users.findOne({ email: email.trim().toLowerCase() });
    const ok = user && (await bcrypt.compare(String(password), user.password));
    if (!ok) return res.status(401).json({ msg: "Invalid email or password" });

    const token = jwt.sign({ id: user._id.toString(), name: user.name, email: user.email }, JWT_SECRET, {
      expiresIn: "2h",
    });
    res.json({ token, user: { name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ---------- student CRUD (protected) ----------
app.get("/api/students", auth, async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const filter = {};
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: rx }, { prn: rx }, { email: rx }, { course: rx }];
    }
    const list = await students.find(filter).sort({ createdAt: -1 }).toArray();
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

app.get("/api/students/:id", auth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ msg: "Invalid student id" });
    const s = await students.findOne({ _id: new ObjectId(req.params.id) });
    if (!s) return res.status(404).json({ msg: "Student not found" });
    res.json(s);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

app.post("/api/students", auth, async (req, res) => {
  try {
    const s = cleanStudent(req.body);
    const error = validateStudent(s);
    if (error) return res.status(400).json({ msg: error });

    const dup = await students.findOne({ prn: s.prn });
    if (dup) return res.status(409).json({ msg: "A student with this PRN already exists" });

    const result = await students.insertOne({ ...s, createdAt: new Date(), createdBy: req.user.email });
    res.status(201).json({ _id: result.insertedId, ...s });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

app.put("/api/students/:id", auth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ msg: "Invalid student id" });
    const s = cleanStudent(req.body);
    const error = validateStudent(s);
    if (error) return res.status(400).json({ msg: error });

    const id = new ObjectId(req.params.id);
    const dup = await students.findOne({ prn: s.prn, _id: { $ne: id } });
    if (dup) return res.status(409).json({ msg: "Another student already has this PRN" });

    const result = await students.updateOne({ _id: id }, { $set: { ...s, updatedAt: new Date() } });
    if (result.matchedCount === 0) return res.status(404).json({ msg: "Student not found" });
    res.json({ msg: "Student updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

app.delete("/api/students/:id", auth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ msg: "Invalid student id" });
    const result = await students.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ msg: "Student not found" });
    res.json({ msg: "Student deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ---------- start ----------
async function start() {
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    users = db.collection("users");
    students = db.collection("students");
    await users.createIndex({ email: 1 }, { unique: true });
    await students.createIndex({ prn: 1 }, { unique: true });
    console.log("Connected to MongoDB, database: " + DB_NAME);
    app.listen(PORT, () => console.log("Server started at http://localhost:" + PORT));
  } catch (err) {
    console.error("MongoDB connection failed. Is MongoDB running? ->", err.message);
    process.exit(1);
  }
}

start();
