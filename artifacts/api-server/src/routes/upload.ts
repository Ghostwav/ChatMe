import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAuth } from "../lib/auth-middleware";

const router = Router();

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 16 * 1024 * 1024 }, // 16MB
  fileFilter: (_req, file, cb) => {
    const allowed = /image\/(jpeg|png|gif|webp)|video\/(mp4|webm)|audio\/(mp3|mpeg|wav|ogg)|application\/(pdf|msword|zip)/;
    cb(null, allowed.test(file.mimetype));
  },
});

router.post("/upload", requireAuth, upload.single("file"), (req, res) => {
  if (!req.file) { res.status(400).json({ error: "No file" }); return; }

  const fileUrl = `/api/uploads/${req.file.filename}`;
  res.json({
    url: fileUrl,
    type: req.file.mimetype,
    size: req.file.size,
    fileName: req.file.originalname,
  });
});

router.use("/uploads", (req, res, next) => {
  res.sendFile(path.join(uploadDir, path.basename(req.path)), (err) => {
    if (err) next();
  });
});

export default router;
