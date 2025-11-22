import express, { Router } from "express";
import multer from "multer";
import { uploadMedia,getAllMedia } from "../controller/media-controller.js";
import { authenticateRequest ,} from "../middleware/auth-middleware.js";
import logger from "../utils/logger.js";

const mediaRouter = express.Router();
const upload=multer({storage:multer.memoryStorage(),
    limits:{
        fileSize:1024*1024*10
    }
}).single("file")
mediaRouter.post("/",authenticateRequest,(req,res,next)=>{
upload(req,res,function(err){
    console.log(err,"err=========TTTTTT======",req.file)
    if(err instanceof multer.MulterError){
        logger.error(err)
        return res.status(500).json({
            success: false,
            message: "Multer Error uploading media",
            error: err,
        });
    }
    else if(err){
        logger.error(err)
        return res.status(500).json({
            success: false,
            message: "Unknown error uploading media",
            error: err,
            stack: err.stack
        });
    }
   if(!req.file){
        logger.error("No file found,Please add a file and try again")
        return res.status(400).json({
            success: false,
            message: "No file found",
        });
   }
   next();
})
},uploadMedia);

mediaRouter.get("/get-all-media",authenticateRequest,getAllMedia);
           
export default mediaRouter;                 