import connectDb from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config({ path: "./env" });
connectDb()
  .then(() =>
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on ${process.env.PORT}`);
    })
  )
  .catch((err) => console.log("Mongo Db connection failed, ", err));
