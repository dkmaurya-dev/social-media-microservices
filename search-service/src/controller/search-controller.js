import Search from "../models/search.js";
import logger from "../utils/logger.js";

export const searchPost = async (req, res) => {
  logger.info("Searching post");
  try {
    const { query } = req.query;
    const result = await Search.find(
      {
        $text: {
          $search: query,
        },
      },
      {
        score: { $meta: "textScore" },
      }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(10);
 
    res.status(201).json({
      success: true,
      message: " Search created successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error while searching post", error);
    res.status(500).json({
      success: false,
      message: "Error while searching post",
      error: error,
    });
  }
};

export const getAllSearch = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const cacheKey = `search:${page}:${limit}`;
    // const cachedSearch = await req.redisClient.get(cacheKey);
    // if (cachedSearch) {
    //   return res.status(200).json({
    //     success: true,
    //     message: "Search retrieved successfully",
    //     data: JSON.parse(cachedSearch),
    //   });
    // }
    const search = await Search.find({}).sort({ createdAt: -1 }).skip(startIndex).limit(limit);
    const totalSearch = await Search.countDocuments({});
    const result ={
      search,
      currentPage: page,
      totalPages: Math.ceil(totalSearch / limit),
      totalSearch,
    }
    // save to redis
    // await req.redisClient.setex(cacheKey,300,JSON.stringify(result));
    res.status(200).json({
      success: true,
      message: "Search retrieved successfully",
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

