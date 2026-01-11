const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// Check if R2 functionality is enabled via env vars
const useR2 = process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_ENDPOINT && process.env.R2_BUCKET_NAME;

let uploadMiddleware;

if (useR2) {
    console.log('Using Cloudflare R2 for Image Storage');

    const s3 = new S3Client({
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        }
    });

    uploadMiddleware = multer({
        storage: multerS3({
            s3: s3,
            bucket: process.env.R2_BUCKET_NAME,
            acl: 'public-read', // R2 usually ignores this or handles it via bucket policy
            contentType: multerS3.AUTO_CONTENT_TYPE,
            metadata: function (req, file, cb) {
                cb(null, { fieldName: file.fieldname });
            },
            key: function (req, file, cb) {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, 'equipment/' + file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
            }
        }),
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
        fileFilter: function (req, file, cb) {
            checkFileType(file, cb);
        }
    });

} else {
    // Fallback to local storage if R2 is not configured
    console.log('Using Local Storage for Images (R2 not configured)');

    // Set storage engine
    const storage = multer.diskStorage({
        destination: './uploads/',
        filename: function (req, file, cb) {
            cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
        }
    });

    uploadMiddleware = multer({
        storage: storage,
        limits: { fileSize: 5000000 },
        fileFilter: function (req, file, cb) {
            checkFileType(file, cb);
        }
    });
}

// Check File Type
function checkFileType(file, cb) {
    // Allowed ext
    const filetypes = /jpeg|jpg|png|webp/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

module.exports = uploadMiddleware;
