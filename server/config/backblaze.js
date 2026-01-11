const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');

// Configure the S3 client for Backblaze B2
const s3 = new S3Client({
  endpoint: process.env.B2_ENDPOINT,
  region: process.env.B2_REGION,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID, // This is your Application Key ID
    secretAccessKey: process.env.B2_APPLICATION_KEY, // This is your Application Key
  },
});

// Configure Multer to use B2 for storage
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.B2_BUCKET_NAME,
    acl: 'public-read', // Make files publicly readable
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'equipment-' + uniqueSuffix + path.extname(file.originalname));
    },
  }),
});

module.exports = upload;
