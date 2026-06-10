const { MongoClient } = require('mongodb');

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/removation_ai';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('removation_ai');
    const settings = db.collection('appsettings');
    
    console.log('--- Current Settings ---');
    const all = await settings.find({}).toArray();
    console.log(JSON.stringify(all, null, 2));
    
  } finally {
    await client.close();
  }
}

main().catch(console.error);
