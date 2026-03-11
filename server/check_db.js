require('dotenv').config();
const mongoose = require('mongoose');
const Repo = require('./models/Repo');
const User = require('./models/User');
const { decrypt } = require('./services/KeyEncryptor');

async function debugSession() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/repochat');
  
  const users = await User.find({});
  console.log('--- USER DATA DUMP ---');
  for (const u of users) {
    console.log(`User: ${u.name} (${u._id})`);
    console.log(`  Email: ${u.email}`);
    console.log(`  Has API Key: ${!!u.apiKey}`);
    if (u.apiKey) {
      try {
        const key = decrypt(u.apiKey);
        console.log(`  KV Length: ${key.length}`);
        console.log(`  Provider: ${u.provider}`);
      } catch (e) {
        console.log(`  Decryption FAILED: ${e.message}`);
      }
    }
    console.log('----------------------');
  }

  const repos = await Repo.find({});
  console.log('\n--- REPO STATUS DUMP ---');
  repos.forEach(r => {
    console.log(`Repo: ${r.name} (${r._id})`);
    console.log(`  UserID: ${r.userId}`);
    console.log(`  Status: ${r.status}`);
    console.log(`  LocalPath: ${r.localPath} (Exists: ${require('fs').existsSync(r.localPath)})`);
    console.log('------------------------');
  });
  
  process.exit(0);
}

debugSession().catch(err => {
  console.error(err);
  process.exit(1);
});
