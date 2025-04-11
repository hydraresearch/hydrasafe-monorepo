import mongoose from 'mongoose';

export async function connectDatabase(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const dbName = process.env.MONGODB_DB_NAME || 'hydrasafe-dev';

  try {
    await mongoose.connect(`${uri}/${dbName}`, {
      // These are mongoose 7.x options
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('Connected to MongoDB');
    
    // Set up event handlers
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      process.exit(0);
    });

    return mongoose;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

export function getConnection(): mongoose.Connection {
  return mongoose.connection;
}

export async function closeConnection(): Promise<void> {
  await mongoose.connection.close();
}
