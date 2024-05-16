import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

export const uploadOnCloud = async function (filePath) {
  try {
    if (!filePath) return "Could not find the file path!";
    // upload the file on cloud
    const response = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
    });
    console.log("File uploaded: ", response);
    console.log("file url: ", response.url);
    return response.url;
  } catch (error) {
    fs.unlinkSync(filePath);
    return null;
  }
};
