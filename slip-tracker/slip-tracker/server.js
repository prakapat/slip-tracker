require('dotenv').config();
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Multer Config ─────────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('ประเภทไฟล์ไม่รองรับ กรุณาใช้ JPG, PNG, WEBP หรือ PDF'));
  }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── POST /api/upload ──────────────────────────────────────────────────────────
app.post('/api/upload', upload.single('slip'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'กรุณาแนบไฟล์' });
    }

    const { type = 'expense', category = 'อื่นๆ', note = '' } = req.body;

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    formData.append('type', type);
    formData.append('category', category);
    formData.append('note', note);
    formData.append('fileName', req.file.originalname);
    formData.append('uploadedAt', new Date().toISOString());

    const n8nRes = await axios.post(
      process.env.N8N_WEBHOOK_URL,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 60000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    res.json({ success: true, data: n8nRes.data });
  } catch (err) {
    console.error('[upload]', err.message);
    res.status(500).json({
      success: false,
      error: err.response?.data?.message || err.message
    });
  }
});

// ─── GET /api/transactions ─────────────────────────────────────────────────────
app.get('/api/transactions', async (req, res) => {
  try {
    const n8nRes = await axios.get(
      `${process.env.N8N_BASE_URL}/webhook/slip-get-transactions`,
      { params: req.query, timeout: 30000 }
    );
    res.json(n8nRes.data);
  } catch (err) {
    console.error('[transactions]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/summary ─────────────────────────────────────────────────────────
app.get('/api/summary', async (req, res) => {
  try {
    const n8nRes = await axios.get(
      `${process.env.N8N_BASE_URL}/webhook/slip-get-summary`,
      { params: req.query, timeout: 30000 }
    );
    res.json(n8nRes.data);
  } catch (err) {
    console.error('[summary]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🧾 Slip Tracker running → http://localhost:${PORT}`);
});
