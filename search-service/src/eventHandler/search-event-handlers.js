import logger from "../utils/logger.js";
import { searchPost } from "../controller/search-controller.js";
import Search from "../models/search.js";

export const handlePostCreatedEvent = async (event) => {
    console.log(event,"event post created")
    const {postId,author,title,createdAt} = event
    try{
        const newSearchPost= new Search({
            postId:postId,
            title:title,
            userId:author,  
            createdAt:createdAt
        })
        await newSearchPost.save()

   
        logger.info(" Process of creating search completed successfully",postId,"newSearchPost",newSearchPost._id.toString())
}catch(error){
    logger.error("Error creating search",error)
}
}    

export const handlePostDeletedEvent = async (event) => {
    console.log(event,"event post deleted")
    try{
        await Search.findOneAndDelete({postId:event.postId})

        logger.info("Process of deleting search completed successfully",event.postId)
}catch(error){
    logger.error("Error deleting search",error)
}
}   


export default handlePostCreatedEvent   