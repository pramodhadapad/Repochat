require('dotenv').config();
const mongoose = require('mongoose');

async function dropIndex() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/repochat');
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('collaborations');
    const result = await collection.dropIndex('shareLink_1');
    console.log('Successfully dropped index shareLink_1:', result);
  } catch (err) {
    console.error('Error dropping index (it might not exist):', err.message);
  }
  process.exit(0);
}

dropIndex().catch(err => {
  console.error(err);
  process.exit(1);
});
