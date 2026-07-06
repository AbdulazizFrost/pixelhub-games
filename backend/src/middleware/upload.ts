import multer from 'multer';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads';

// Ensure directories exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(path.join(UPLOAD_DIR, 'covers'))) {
  fs.mkdirSync(path.join(UPLOAD_DIR, 'covers'), { recursive: true });
}
if (!fs.existsSync(path.join(UPLOAD_DIR, 'banners'))) {
  fs.mkdirSync(path.join(UPLOAD_DIR, 'banners'), { recursive: true });
}
if (!fs.existsSync(path.join(UPLOAD_DIR, 'screenshots'))) {
  fs.mkdirSync(path.join(UPLOAD_DIR, 'screenshots'), { recursive: true });
}
if (!fs.existsSync(path.join(UPLOAD_DIR, 'games'))) {
  fs.mkdirSync(path.join(UPLOAD_DIR, 'games'), { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = UPLOAD_DIR;
    if (file.fieldname === 'cover') {
      dest = path.join(UPLOAD_DIR, 'covers');
    } else if (file.fieldname === 'banner') {
      dest = path.join(UPLOAD_DIR, 'banners');
    } else if (file.fieldname === 'screenshots') {
      dest = path.join(UPLOAD_DIR, 'screenshots');
    } else if (file.fieldname === 'zipFile') {
      dest = path.join(UPLOAD_DIR, 'games');
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedImageTypes = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const allowedZipTypes = ['.zip'];
  
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (file.fieldname === 'zipFile') {
    if (allowedZipTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only ZIP files are allowed for game builds!'));
    }
  } else {
    if (allowedImageTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (.jpg, .jpeg, .png, .webp, .gif) are allowed for media uploads!'));
    }
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2000 * 1024 * 1024 // 2000 MB (2 GB) max limit
  }
});
