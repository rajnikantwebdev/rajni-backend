import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const uploadOnCloud = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file has been uploaded successfull
    // console.log("file is uploaded on cloudinary ", response.url);
    fs.unlinkSync(localFilePath);
    // console.log("response: ", response);
    return response;
  } catch (error) {
    console.log("error occurs while uploading on cloud: ", error);
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
    return null;
  }
};

export const removeFromCloud = async (img_id) => {
  try {
    const response = await cloudinary.uploader.destroy(img_id);
    return response === true;
  } catch (error) {
    console.log("error while deleting from cloud", error);
    return false;
  }
};

export { uploadOnCloud };
