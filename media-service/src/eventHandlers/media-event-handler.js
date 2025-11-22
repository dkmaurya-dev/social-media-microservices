import logger from "../utils/logger.js";
import { deleteMediaFromCloudinary } from "../utils/cloudinary.js";
import Media from "../models/media.js";

const handlePostDeletedEvent = async (event) => {
    console.log(event,"event post deleted")
    const {postId,mediaIds} = event
    try{
        const getMediaTodDelete = await Media.find({_id:{$in:mediaIds}})

        for(let media of getMediaTodDelete){
            await deleteMediaFromCloudinary(media.publicId)
            await Media.findByIdAndDelete(media._id)
            logger.info("Media deleted successfully",media._id,"Associated with Post",postId)   
        }
        logger.info(" Process of deleting media completed successfully",postId)
}catch(error){
    logger.error("Error deleting media",error)
}
}


export default handlePostDeletedEvent