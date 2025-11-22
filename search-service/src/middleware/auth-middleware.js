// const jwt = require("jsonwebtoken");
import logger from "../utils/logger.js";
// import User from "../models/user.js";

export const authenticateRequest = async (req, res, next) => {
    try {
      const urerId =req.headers["x-user-id"];
      if (!urerId) {
        logger.error("No user id found in request");
        return res.status(401).json({
          success: false,
          message: "authentication required,Pleaselogin to continue",
        });
      }
      req.user={userId:urerId}
    next();
    } catch (error) {
        logger.error(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error,
        });
    }
};