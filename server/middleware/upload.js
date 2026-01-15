const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// Check which storage to use based on env vars
const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;
const useR2 = process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_ENDPOINT && process.env.R2_BUCKET_NAME;

let uploadMiddleware;

if (useCloudinary) {
    console.log('Using Cloudinary for Image Storage (Free & Optimized)');

    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    const storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'farmlink_equipment',
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
            transformation: [{ width: 1200, height: 1200, crop: 'limit' }] // Auto-optimize size
        }
    });

    uploadMiddleware = multer({
        storage: storage,
        limits: { fileSize: 10 * 1024 * 1024 }, // Cloudinary is generous, 10MB limit
        fileFilter: function (req, file, cb) {
            checkFileType(file, cb);
        }
    });

} else if (useR2) {
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
            contentType: multerS3.AUTO_CONTENT_TYPE,
            metadata: function (req, file, cb) {
                cb(null, { fieldName: file.fieldname });
            },
            key: function (req, file, cb) {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, 'equipment/' + file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
            }
        }),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: function (req, file, cb) {
            checkFileType(file, cb);
        }
    });

} else {
    // Fallback to local storage
    console.log('Using Local Storage for Images (Cloudinary/R2 not configured)');

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
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

module.exports = uploadMiddleware;

