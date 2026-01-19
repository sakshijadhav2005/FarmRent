const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/farm-rental');
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Fix for E11000 duplicate key error on mobile field
        // This drops the old non-sparse index and Mongoose will recreate it with sparse: true
        try {
            const User = mongoose.connection.collection('users');
            const indexes = await User.indexes();
            const mobileIndex = indexes.find(idx => idx.name === 'mobile_1');

            if (mobileIndex && !mobileIndex.sparse) {
                console.log('⚠️ Found old mobile_1 index without sparse option, dropping it...');
                await User.dropIndex('mobile_1');
                console.log('✅ Old mobile_1 index dropped. New sparse index will be created automatically.');
            }
        } catch (indexError) {
            // Index might not exist, that's fine
            if (!indexError.message.includes('index not found')) {
                console.log('Index check note:', indexError.message);
            }
        }

        return true;
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        console.error('Please make sure MongoDB is installed and running');
        console.error('You can install MongoDB from: https://www.mongodb.com/try/download/community');
        return false;
    }
};

module.exports = connectDB;
