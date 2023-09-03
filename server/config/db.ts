const mongose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongose.connect(process.env.MONGO_URL || "");

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

export default connectDB;
