import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const uploadToCloudinary = async (localFilePath) => {
  if (!localFilePath) return null

  const response = await cloudinary.uploader.upload(localFilePath, {
    resource_type: "raw",
    folder: process.env.CLOUDINARY_FOLDER,
    access_mode: "public",
  })

  // delete local file after upload
  fs.unlinkSync(localFilePath)

  return response
}

const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return null

  const response = await cloudinary.uploader.destroy(publicId, {
    resource_type: "raw",
  })

  return response
}

export { uploadToCloudinary, deleteFromCloudinary }