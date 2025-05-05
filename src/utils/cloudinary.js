// =========== cloudinary.js
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a base64 image or file to Cloudinary
 * @param {string} file - base64 or file URL
 * @param {string} folder - target folder on Cloudinary
 * @returns {object} - Cloudinary response
 */
export const uploadOnCloudinary = async (file, folder) => {
  try {
    const uploadRes = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: "image",
    });
    return uploadRes;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    return null;
  }
};
