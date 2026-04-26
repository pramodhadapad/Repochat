require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const Repo = require('./server/models/Repo');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const repos = await Repo.find().sort({createdAt: -1}).limit(5);
  repos.forEach(r => {
    console.log(`Repo: ${r.name}, Status: ${r.status}, localPath: ${r.localPath}`);
    const fs = require('fs');
    if (r.localPath) {
      console.log(`  Path exists? ${fs.existsSync(r.localPath)}`);
    }
  });
  process.exit(0);
});
