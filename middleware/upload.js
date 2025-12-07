import multer from "multer";
import path from "path";

const tempDir = path.resolve("temp");

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, tempDir);
  },
  filename: (_, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

export default upload;
