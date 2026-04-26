const mongoose = require('mongoose');
require('dotenv').config({path: './server/.env'});
const User = require('./server/models/User');

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  await User.updateMany({}, {
    $unset: { apiKey: 1, model: 1 },
    $set: { provider: 'custom' }
  });
  console.log('Successfully cleared corrupted API keys.');
  process.exit(0);
}

fix().catch(console.error);
