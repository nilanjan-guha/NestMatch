const mongoose = require('mongoose');

async function run() {
  const uri = "mongodb+srv://nilanjanguha8_db_user:91Dm1HZZaCiU7n1o@nestmatchdb.tlqzxjv.mongodb.net/test?retryWrites=true&w=majority";
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  
  const result = await db.collection('users').updateOne(
    { email: "nilanjanguha8@gmail.com" },
    { $set: { role: "admin" } }
  );
  
  console.log('Updated user:', result);
  process.exit(0);
}

run().catch(console.error);
