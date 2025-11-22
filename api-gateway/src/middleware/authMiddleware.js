
import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";


export const validateToken = (req, res, next) => {
    console.log(req.url)
    const authHeader = req.headers["authorization"];
const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        logger.warn("No token provided");
        return res.status(401).json({
            success: false,
            message: "Authentication required",
        });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET,(err,user)=>{
            if(err){
                logger.error("Invalid token",err);
                return res.status(429).json({
                    success: false,
                    message: "Invalid token",
                });
            }
            console.log(user,"======user")
            req.user=user;
                    next();

        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: "authentication required,Pleaselogin to continue",
        });
    }
}
