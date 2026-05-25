# 🧾 SlipVault — ระบบอัพโหลดสลิปโอนเงินอัตโนมัติ

> อัพโหลดสลิป → OCR อ่านข้อมูล (AksonOCR) → บันทึก Google Sheets → ดูแดชบอร์ด

---

## 🏗️ Architecture

```
[Web App (Railway)]
       ↓ POST multipart/form-data
[n8n Webhook: upload-slip]
       ↓ base64 image
[AksonOCR API]
       ↓ markdown OCR text
[n8n Code: Parse data]
       ↓ structured row
[Google Sheets]
       ↑ GET data (dashboard)
[n8n Webhooks: get-transactions / get-summary]
```

---

## 📋 Google Sheets Structure

สร้างชีตชื่อ **`Transactions`** และ Row 1 เป็น Header ดังนี้:

| คอลัมน์ | ชื่อ Header | ตัวอย่าง |
|---------|------------|---------|
| A | ID | SV-1718000000000 |
| B | Uploaded At | 2024-06-01T10:30:00.000Z |
| C | Transaction Date | 01/06/2024 |
| D | Transaction Time | 10:25:30 |
| E | Amount | 1500.00 |
| F | Type | expense |
| G | Category | อาหารและเครื่องดื่ม |
| H | Merchant / Payee | ร้านอาหาร ABC |
| I | Bank Sender | ธ.กสิกรไทย (KBANK) |
| J | Bank Receiver | ธ.ไทยพาณิชย์ (SCB) |
| K | Account Number | 012-3-45678-9 |
| L | Reference No | REF202406011025300001 |
| M | Note | ค่าอาหารกลางวัน |
| N | OCR Raw Text | โอนเงินสำเร็จ วันที่... |
| O | File Name | slip_001.jpg |
| P | Status | processed |

---

## 🚀 Step-by-Step Setup

### STEP 1 — สมัคร AksonOCR

1. ไปที่ https://dashboard.aksonocr.com
2. สมัครสมาชิก (ฟรี 100 หน้า/วัน)
3. สร้าง **API Key**
4. คัดลอก API Key ไว้ใช้ใน n8n

---

### STEP 2 — เตรียม Google Sheets

1. สร้าง Google Sheet ใหม่
2. เปลี่ยนชื่อ Sheet แรกเป็น **`Transactions`**
3. Row 1: ใส่ชื่อ Header ตามตารางด้านบนทุกคอลัมน์ A–P
4. คัดลอก **Spreadsheet ID** จาก URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```

---

### STEP 3 — ตั้งค่า n8n

#### 3.1 Import Workflows
1. เปิด n8n Dashboard
2. ไป **Workflows** → **Import from File**
3. เลือกไฟล์ `n8n-workflow.json`
4. จะได้ 3 workflows: Upload, Get Transactions, Get Summary

#### 3.2 ตั้งค่า Credentials

**AksonOCR API Key:**
1. ไป **Settings** → **Credentials** → **Add Credential**
2. เลือก **HTTP Header Auth**
3. ตั้งชื่อ: `AksonOCR API Key`
4. Name: `X-API-Key`
5. Value: `[API Key ที่ได้จาก AksonOCR]`

**Google Sheets (OAuth2):**
1. ไป **Settings** → **Credentials** → **Add Credential**
2. เลือก **Google Sheets OAuth2 API**
3. ตั้งชื่อ: `Google Sheets (OAuth2)`
4. ทำตามขั้นตอน OAuth เชื่อมต่อ Google Account

#### 3.3 แก้ไข Google Sheet ID
ใน **3 workflows** ทุก node ชื่อ `Google Sheets - ...`:
- เปลี่ยน `YOUR_GOOGLE_SHEET_ID` → Spreadsheet ID ของคุณ

#### 3.4 Activate Workflows
กด **Active** ใน 3 workflows ทั้งหมด

#### 3.5 Copy Webhook URLs
จาก workflow **"Upload & Process Slip"**, node **Webhook**:
- คัดลอก **Production URL** เช่น:
  ```
  https://your-n8n.com/webhook/upload-slip
  ```

---

### STEP 4 — Deploy Web App บน Railway

#### 4.1 Push code ขึ้น GitHub
```bash
# ใน folder slip-tracker/
git init
git add .
git commit -m "initial: SlipVault web app"

# สร้าง repo บน GitHub แล้ว push
git remote add origin https://github.com/YOUR_USERNAME/slip-tracker.git
git branch -M main
git push -u origin main
```

#### 4.2 Deploy บน Railway
1. ไปที่ https://railway.app
2. **New Project** → **Deploy from GitHub repo**
3. เลือก repo `slip-tracker`
4. Railway จะตรวจพบ Dockerfile อัตโนมัติ

#### 4.3 ตั้งค่า Environment Variables บน Railway
ไป **Variables** → เพิ่ม:

| Key | Value |
|-----|-------|
| `N8N_WEBHOOK_URL` | `https://your-n8n.com/webhook/upload-slip` |
| `N8N_BASE_URL` | `https://your-n8n.com` |
| `PORT` | `3000` |

#### 4.4 Generate Domain
ไป **Settings** → **Networking** → **Generate Domain**
ได้ URL เช่น: `https://slip-tracker-production.up.railway.app`

---

### STEP 5 — ทดสอบระบบ

1. เปิด web app URL
2. อัพโหลดสลิป (JPG/PNG/PDF)
3. ตรวจสอบผลลัพธ์ที่หน้าเว็บ
4. เปิด Google Sheets ดูข้อมูลที่บันทึก
5. เปิด `/dashboard.html` ดูแดชบอร์ด

---

## 🔧 Troubleshooting

**n8n ไม่รับไฟล์:**
- ตรวจสอบ `N8N_WEBHOOK_URL` ถูกต้องหรือไม่
- ตรวจสอบ n8n workflow ถูก activate แล้ว

**AksonOCR error:**
- ตรวจสอบ API Key ถูกต้อง
- ตรวจสอบ credit ใน AksonOCR Dashboard

**Google Sheets ไม่บันทึก:**
- ตรวจสอบ Spreadsheet ID ถูกต้อง
- ตรวจสอบ OAuth credentials
- ตรวจสอบ Sheet ชื่อ `Transactions` ตรงกัน
- ตรวจสอบ Header Row 1 ตรงกับ n8n mapping

**Dashboard ไม่แสดงข้อมูล:**
- ตรวจสอบ `N8N_BASE_URL` ถูกต้อง
- ทดสอบ webhook URL โดยตรงใน browser

---

## 📁 Project Structure

```
slip-tracker/
├── server.js           Express web server
├── package.json
├── Dockerfile
├── railway.toml
├── .env.example
├── .gitignore
├── public/
│   ├── index.html      หน้าอัพโหลดสลิป
│   └── dashboard.html  แดชบอร์ดรายรับ-รายจ่าย
└── n8n-workflow.json   Import ลง n8n (3 workflows)
```

---

## 🔌 API Endpoints (Web App)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/upload` | อัพโหลดสลิป → n8n → OCR → Sheets |
| GET | `/api/transactions` | ดึงรายการทั้งหมด |
| GET | `/api/summary` | ดึงสรุปรายรับ-รายจ่าย |
| GET | `/health` | Health check |

---

## 📌 n8n Webhook Paths

| Webhook | Method | Description |
|---------|--------|-------------|
| `/webhook/upload-slip` | POST | รับไฟล์ → OCR → บันทึก Sheets |
| `/webhook/slip-get-transactions` | GET | ดึงข้อมูลทั้งหมด |
| `/webhook/slip-get-summary` | GET | สรุปยอดรายรับ-รายจ่าย |
