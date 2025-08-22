// Import Mongoose using the new 'import' syntax
import mongoose from 'mongoose';

/**
 * Establishes a connection to the MongoDB database.
 * It uses the connection string stored in the MONGO_URI environment variable.
 */
const connectDB = async () => {
  try {
    // Set strictQuery to false to prepare for Mongoose 7's default behavior
    mongoose.set('strictQuery', false);

    // Attempt to connect to the database using the connection string
    const conn = await mongoose.connect(process.env.MONGO_URI);

    // If the connection is successful, log a confirmation message
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // If an error occurs during connection, log the error message
    console.error(`Error: ${error.message}`);
    // Exit the Node.js process with a failure code (1)
    process.exit(1);
  }
};

// Export the connectDB function using the new 'export default' syntax
export default connectDB;
