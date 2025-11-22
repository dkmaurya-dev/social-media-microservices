import logger from "./logger.js";
import dotenv from "dotenv";
dotenv.config();
import cloudinary from "cloudinary";

// Cloudinary Config
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log(cloudinary.v2.config());
// Upload Function
export const uploadMediaToCloudinary = async (file) => {
    try {
        return await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.v2.uploader.upload_stream(
                { resource_type: "auto" },
                (error, result) => {
                    if (error) {
                        logger.error("Error uploading media to Cloudinary:", error);
                        return reject(error);
                    }
                    resolve(result);
                }
            );

            uploadStream.end(file.buffer);
        });

    } catch (err) {
        logger.error("Cloudinary upload failed:", err);
        throw err;
    }
};

export const deleteMediaFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.v2.uploader.destroy(publicId);
        logger.info("Media deleted from Cloudinary:", result)
        return result;
        // return await new Promise((resolve, reject) => {
        //     cloudinary.v2.api.delete_resources(
        //         mediaUrl,
        //         (error, result) => {
        //             if (error) {
        //                 logger.error("Error deleting media from Cloudinary:", error);
        //                 return reject(error);
        //             }
        //             resolve(result);
        //         }
        //     );
        // });
    } catch (err) {
        logger.error("Cloudinary delete failed:", err);
        throw err;
    }
};

// export const getCloudinaryMediaUrl = (mediaUrl) => {
//     return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${mediaUrl}`;
// };

// export const getCloudinaryThumbnailUrl = (mediaUrl) => {
//     return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/c_thumb,w_200/${mediaUrl}`;
// };          
