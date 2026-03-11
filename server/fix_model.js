require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function fixModels() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/repochat');
  
  const r1 = await User.updateMany(
    { model: 'gemini-1.5-flash' },
    { model: 'gemini-2.0-flash' }
  );
  console.log('Updated gemini-1.5-flash users:', r1.modifiedCount);

  const r2 = await User.updateMany(
    { model: 'gemini-1.5-pro' },
    { model: 'gemini-1.5-pro-latest' }
  );
  console.log('Updated gemini-1.5-pro users:', r2.modifiedCount);
  
  // Show current state
  const users = await User.find({}, 'name email provider model');
  console.log('Current users:', JSON.stringify(users, null, 2));
  
  await mongoose.disconnect();
}

fixModels().catch(console.error);
