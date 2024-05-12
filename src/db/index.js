import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import { app } from "../app.js";

const connectDb = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    app.on("error", (err) => {
      console.log("Connection FAILED due to, ", err);
    });
    console.log(
      `\n MongoDb connected!! DB Host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("ERROR: ", error);
    process.exit(1);
  }
};

export default connectDb;
