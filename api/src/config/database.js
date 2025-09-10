import mongoose from 'mongoose';

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

const connectDB = async (retryCount = 0) => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MongoDB URI is not configured in environment variables');
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      connectTimeoutMS: 10000,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB (attempt ${retryCount + 1}): ${error.message}`);
    
    // Provide specific guidance for common errors
    if (error.message.includes('IP that isn\'t whitelisted')) {
      console.error('🔧 Solution: Add your current IP address to MongoDB Atlas IP whitelist:');
      console.error('   1. Go to https://cloud.mongodb.com/');
      console.error('   2. Navigate to Network Access');
      console.error('   3. Add your current IP address or use 0.0.0.0/0 for development');
    } else if (error.message.includes('authentication failed')) {
      console.error('🔧 Solution: Check your MongoDB username and password in the connection string');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.error('🔧 Solution: Check your MongoDB connection string and network connectivity');
    }
    
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying connection in ${RETRY_DELAY / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return connectDB(retryCount + 1);
    }
    
    console.error('❌ Failed to connect to MongoDB after all retry attempts');
    console.error('💡 Make sure your MongoDB Atlas cluster is running and accessible');
    process.exit(1);
  }
};

export default connectDB; 