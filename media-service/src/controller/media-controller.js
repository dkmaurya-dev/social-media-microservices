

import Media from "../models/media.js";
import logger from "../utils/logger.js";
import {validateMediaInput} from '../utils/validation.js'
import { uploadMediaToCloudinary } from "../utils/cloudinary.js";
// import { redisClient } from "../utils/redis.js";


export const uploadMedia = async (req, res) => {
    logger.info("updating media")
    try {
        console.log(req.file,"File=========================")
       if(!req.file){
        logger.error("No file found,Please add a file and try again")
        return res.status(400).json({
            success: false,
            message: "No file uploaded",
        });
       }

        const {originalname,mimetype,buffer} = req.file;
        const userId = req.user.userId;
        // logger.info("originalName",originalname,"mimeType",mimetype,"buffer",buffer,"userId",userId)    
        logger.info("File uploading to cloudinary.");
        const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file);
        console.log(cloudinaryUploadResult,"cloudinaryUploadResult")
        
        logger.info(`Cloudinary upload successfully.Public Id-${cloudinaryUploadResult.public_id}`)
       const newlyCreateMedia =new Media({
        publicId:cloudinaryUploadResult.public_id,
        originalName:originalname,
        mimeType:mimetype,
        url:cloudinaryUploadResult.secure_url,
        author:userId
       })
       console.log(newlyCreateMedia,"newlyCreateMedia")
await newlyCreateMedia.save()
res.status(201).json({
    success:true,
    mediaId:newlyCreateMedia._id,
    url:newlyCreateMedia.url,
    message:'Media upload is successful.'
})
      
    } catch (error) {
        logger.error(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error,
        });
    }
};













const invalidateMediaCache = async (req,input) => {
const cachedKey =`media:${input}`
await req.redisClient.del(cachedKey)
    const keys = await req.redisClient.keys("media:*");
    // logger.info("Invalidating cache for keys", keys);
    // const cacheKey = `posts:${req.query.page}:${req.query.limit}`;
    // logger.info("Invalidating cache for key", cacheKey);
    if(keys.length>0){
        await req.redisClient.del(keys);
    }
};


export const createMedia = async (req, res) => {
    
    try {
    const { error } = validateMediaInput(req.body);
    if (error) {
      logger.warn("Validation Error", error.details[0].messgae);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
        const { publicId, originalName, mimeType, url } = req.body;
        console.log(req.body,"req.body")
        const media = new Media({
            publicId,
            originalName,
            mimeType,
            url,
            author: req.user.userId,
        });
        const savedMedia = await media.save();
        await invalidateMediaCache(req,media._id.toString())
        logger.info("Media created successfully", savedMedia);
        res.status(201).json({
            success: true,
            message: "Media created successfully",
            data: savedMedia,
        });
    } catch (error) {
        logger.error("Error creating media", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error,
        });
    }
};        // get all media

export const getAllMedia = async (req, res) => {
    try {
       const page = req.query.page || 1;
       const limit = req.query.limit || 10;
const startIndex = (page - 1) * limit;
const endIndex = page * limit;
// const cacheKey = `media:${page}:${limit}`;
//         const cachedMedia = await req.redisClient.get(cacheKey);
//         if (cachedMedia) {
//             return res.status(200).json({
//                 success: true,
//                 message: "Media retrieved successfully",
//                 data: JSON.parse(cachedMedia),
//             });
//         }
        const media = await Media.find({});
        // const totalMedia = await Media.countDocuments({});
        // const result ={
        //     media,
        //     currentPage: page,
        //     totalPages: Math.ceil(totalMedia / limit),
        //     totalMedia,
        // }
        // save to redis
        // await req.redisClient.setex(cacheKey,300,JSON.stringify(result));
         return res.status(200).json({
                success: true,
                message: "Media retrieved successfully",
                data: media,
            });
    } catch (error) {
        logger.error(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error,
        });
    }
};              

export const getMediaById = async (req, res) => {
    try {
        const mediaId = req.params.id;
        const cacheKey = `media:${mediaId}`;
        const cachedMedia = await req.redisClient.get(cacheKey);
        if (cachedMedia) {
            return res.status(200).json({
                success: true,
                message: "Media retrieved successfully",
                data: JSON.parse(cachedMedia),
            });
        }
        const media = await Media.findById(mediaId);
        if (!media) {
            return res.status(404).json({
                success: false,
                message: "Media not found",
            });
        }
      await req.redisClient.setex(cacheKey,3600,JSON.stringify(media));
        res.status(200).json({
            success: true,
            message: "Media retrieved successfully",
            data: media,
        });
    } catch (error) {
        logger.error(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error,
        });
    }
};

export const updateMediaById = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array(),
            });
        }
        const { publicId, originalName, mimeType, url } = req.body;
        const media = await Media.findById(req.params.id);
        if (!media) {
            return res.status(404).json({
                success: false,
                message: "Media not found",
            });
        }
        media.publicId = publicId;
        media.originalName = originalName;
        media.mimeType = mimeType;
        media.url = url;
        const updatedMedia = await media.save();
        res.status(200).json({
            success: true,
            message: "Media updated successfully",
            data: updatedMedia,
        });
    } catch (error) {
        logger.error(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error,
        });
    }
};

export const deleteMediaById = async (req, res) => {
    try {
        console.log(req.params.id,"auther",req.user.userId)
        const media = await Media.findOneAndDelete({_id:req.params.id,author:req.user.userId});
        if (!media) {
            return res.status(404).json({
                success: false,
                message: "Media not found",
            });
        }
        await invalidateMediaCache(req,req.params.id)
        res.status(200).json({
            success: true,
            message: "Media deleted successfully",
        });
    } catch (error) {
        logger.error(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error,
        });  
    }
}                                           