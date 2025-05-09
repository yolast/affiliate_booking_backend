// middlewares/upload.js
import multer from "multer";

const storage = multer.memoryStorage(); // no file saved to disk
const upload = multer({ storage });

export default upload;
