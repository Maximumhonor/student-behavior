const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

const DB_FILE = path.join(__dirname, '.data', 'db.json');

// ตรวจสอบว่ามีโฟลเดอร์ .data หรือยัง
if (!fs.existsSync(path.join(__dirname, '.data'))) {
  fs.mkdirSync(path.join(__dirname, '.data'));
}

function readDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch (e) {}
  return { students: {}, requests: {} };
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// GET ข้อมูลทั้งหมด
app.get('/api/data', (req, res) => {
  res.json(readDB());
});

// POST อัปเดตข้อมูลทั้งหมด (simple replace)
app.post('/api/data', (req, res) => {
  writeDB(req.body);
  res.json({ ok: true });
});

// เพิ่มนักเรียน
app.post('/api/students', (req, res) => {
  const db = readDB();
  const { id, student } = req.body;
  db.students[id] = student;
  writeDB(db);
  res.json({ ok: true });
});

// อัปเดตนักเรียน (photo, hw, logs, redeemLogs)
app.patch('/api/students/:id', (req, res) => {
  const db = readDB();
  const sid = req.params.id;
  if (!db.students[sid]) return res.status(404).json({ error: 'not found' });
  db.students[sid] = { ...db.students[sid], ...req.body };
  writeDB(db);
  res.json({ ok: true });
});

// เพิ่ม log ให้นักเรียน
app.post('/api/students/:id/logs', (req, res) => {
  const db = readDB();
  const sid = req.params.id;
  if (!db.students[sid]) return res.status(404).json({ error: 'not found' });
  if (!db.students[sid].logs) db.students[sid].logs = [];
  db.students[sid].logs.unshift(req.body);
  writeDB(db);
  res.json({ ok: true });
});

// เพิ่ม redeemLog ให้นักเรียน
app.post('/api/students/:id/redeemLogs', (req, res) => {
  const db = readDB();
  const sid = req.params.id;
  if (!db.students[sid]) return res.status(404).json({ error: 'not found' });
  if (!db.students[sid].redeemLogs) db.students[sid].redeemLogs = [];
  db.students[sid].redeemLogs.unshift(req.body);
  writeDB(db);
  res.json({ ok: true });
});

// อัปเดต hw วิชาเดียว
app.patch('/api/students/:id/hw/:subject', (req, res) => {
  const db = readDB();
  const { id, subject } = req.params;
  if (!db.students[id]) return res.status(404).json({ error: 'not found' });
  if (!db.students[id].hw) db.students[id].hw = {};
  db.students[id].hw[subject] = req.body;
  writeDB(db);
  res.json({ ok: true });
});

// คำขอ (good deeds)
app.post('/api/requests', (req, res) => {
  const db = readDB();
  if (!db.requests) db.requests = {};
  const id = 'req' + Date.now();
  db.requests[id] = req.body;
  writeDB(db);
  res.json({ ok: true, id });
});

app.patch('/api/requests/:id', (req, res) => {
  const db = readDB();
  if (!db.requests[req.params.id]) return res.status(404).json({ error: 'not found' });
  db.requests[req.params.id] = { ...db.requests[req.params.id], ...req.body };
  writeDB(db);
  res.json({ ok: true });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Server running on port ' + listener.address().port);
});
