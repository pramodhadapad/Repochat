const mongoose = require('mongoose');

async function run() {
  try {
    const conn = await mongoose.connect('mongodb://localhost:27017/repochat');
    console.log('Connected to MongoDB:', conn.connection.host);
    
    // List all databases
    const admin = conn.connection.db.admin();
    const dbs = await admin.listDatabases();
    console.log('\nAll databases:');
    dbs.databases.forEach(d => console.log('  - ' + d.name + ' (' + (d.sizeOnDisk / 1024).toFixed(0) + ' KB)'));
    
    // Try creating a test user
    const UserSchema = new mongoose.Schema({
      googleId: { type: String, unique: true, required: true },
      name: String,
      email: { type: String, unique: true, required: true },
      avatar: String,
      apiKey: { iv: String, encrypted: String, authTag: String },
      provider: { type: String, default: 'custom' },
      model: String,
      theme: { type: String, default: 'dark' },
      lastLoginAt: Date
    }, { timestamps: true });

    const User = mongoose.model('User', UserSchema);
    
    // Check if any users exist
    const count = await User.countDocuments();
    console.log('\nUsers in database: ' + count);
    
    if (count > 0) {
      const users = await User.find().select('name email googleId').lean();
      users.forEach(u => console.log('  - ' + u.name + ' (' + u.email + ')'));
    }
    
    console.log('\nDatabase is healthy and writable!');
  } catch (err) {
    console.error('\nError:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
