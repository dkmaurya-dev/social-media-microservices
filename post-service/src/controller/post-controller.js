import Post from "../models/post.js";
import logger from "../utils/logger.js";
import {validatePostInput} from '../utils/validation.js'
import { publishEvent } from "../utils/rabbitmq.js";
// import { redisClient } from "../utils/redis.js";
const invalidatePostCache = async (req,input) => {
const cachedKey =`post:${input}`
await req.redisClient.del(cachedKey)
    const keys = await req.redisClient.keys("posts:*");
    // logger.info("Invalidating cache for keys", keys);
    // const cacheKey = `posts:${req.query.page}:${req.query.limit}`;
    // logger.info("Invalidating cache for key", cacheKey);
    if(keys.length>0){
        await req.redisClient.del(keys);
    }
};


export const createPost = async (req, res) => {
    
    try {
    const { error } = validatePostInput(req.body);
    if (error) {
      logger.warn("Validation Error", error.details[0].messgae);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
        const { title, description, mediaIds } = req.body;
        console.log(req.body,"req.body")
        const post = new Post({
            title,
            description,
            mediaIds:mediaIds||[],
            author: req.user.userId,
        });
        const savedPost = await post.save();
await publishEvent('post.created',{
    postId:post._id.toString(),
    author:post.author,
    title:post.title,
    createdAt:post.createdAt
})
        await invalidatePostCache(req,post._id.toString())
        logger.info("Post created successfully", savedPost);
        res.status(201).json({
            success: true,
            message: "Post created successfully",
            data: savedPost,
        });
    } catch (error) {
        logger.error("Error creating post", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error,
        });
    }
};

export const getAllPosts = async (req, res) => {
    try {
       const page = req.query.page || 1;
       const limit = req.query.limit || 10;
const startIndex = (page - 1) * limit;
const endIndex = page * limit;
const cacheKey = `posts:${page}:${limit}`;
        const cachedPosts = await req.redisClient.get(cacheKey);
        if (cachedPosts) {
            return res.status(200).json({
                success: true,
                message: "Posts retrieved successfully",
                data: JSON.parse(cachedPosts),
            });
        }
        const posts = await Post.find({}).sort({ createdAt: -1 }).skip(startIndex).limit(limit);
        const totalPosts = await Post.countDocuments({});
        const result ={
            posts,
            currentPage: page,
            totalPages: Math.ceil(totalPosts / limit),
            totalPosts,
        }
        // save to redis
        await req.redisClient.setex(cacheKey,300,JSON.stringify(result));
         return res.status(200).json({
                success: true,
                message: "Posts retrieved successfully",
                data: result,
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

export const getPostById = async (req, res) => {
    try {
        const postId = req.params.id;
        const cacheKey = `post:${postId}`;
        const cachedPost = await req.redisClient.get(cacheKey);
        if (cachedPost) {
            return res.status(200).json({
                success: true,
                message: "Post retrieved successfully",
                data: JSON.parse(cachedPost),
            });
        }
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }
      await req.redisClient.setex(cacheKey,3600,JSON.stringify(post));
        res.status(200).json({
            success: true,
            message: "Post retrieved successfully",
            data: post,
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

export const updatePostById = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array(),
            });
        }
        const { title, description, mediaUrls } = req.body;
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }
        post.title = title;
        post.description = description;
        post.mediaUrls = mediaUrls;
        const updatedPost = await post.save();
        res.status(200).json({
            success: true,
            message: "Post updated successfully",
            data: updatedPost,
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

export const deletePostById = async (req, res) => {
    try {
        console.log(req.params.id,"auther",req.user.userId)
        const post = await Post.findOneAndDelete({_id:req.params.id,author:req.user.userId});
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }
// publishEvent to rabbitmq
await publishEvent('post-deleted',{
    postId:post._id.toString(),
    author:req.user.userId,
    mediaIds:post.mediaIds
})


        await invalidatePostCache(req,req.params.id)
        res.status(200).json({
            success: true,
            message: "Post deleted successfully",
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