const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  console.log('🔍 Testing MongoDB connection...\n');
  
  console.log('Connection string:', process.env.MONGODB_URI?.replace(/:[^:@]*@/, ':****@'));
  
  try {
    console.log('⏳ Attempting to connect...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      bufferMaxEntries: 0,
      bufferCommands: false,
    });
    
    console.log('✅ Successfully connected to MongoDB!');
    
    // Test basic operations
    console.log('📊 Testing database operations...');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Test if we can create a simple document
    const testCollection = db.collection('connection_test');
    const result = await testCollection.insertOne({ 
      test: true, 
      timestamp: new Date() 
    });
    console.log('✅ Test document inserted:', result.insertedId);
    
    // Clean up test document
    await testCollection.deleteOne({ _id: result.insertedId });
    console.log('🧹 Test document cleaned up');
    
    console.log('\n🎉 All tests passed! MongoDB connection is working properly.');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('IP')) {
      console.log('\n💡 Possible solutions:');
      console.log('1. Add your IP address to MongoDB Atlas whitelist');
      console.log('2. Go to MongoDB Atlas → Network Access → Add IP Address');
      console.log('3. Add 0.0.0.0/0 for testing (allows all IPs)');
    }
    
    if (error.message.includes('authentication')) {
      console.log('\n💡 Authentication issue:');
      console.log('1. Check username and password in connection string');
      console.log('2. Verify database user permissions in MongoDB Atlas');
    }
    
    if (error.message.includes('timeout')) {
      console.log('\n💡 Timeout issue:');
      console.log('1. Check your internet connection');
      console.log('2. Try connecting from a different network');
      console.log('3. Check if your firewall is blocking the connection');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

testConnection();