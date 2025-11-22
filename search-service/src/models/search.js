import mongoose from "mongoose";

const searchPostSchema = new mongoose.Schema({
    postId: {
        type: String,
        required: true,
        unique: true,
    },
    title: {
        type: String,
        required: true, 
        unique: true,
    },
     userId:{
        type: String,
        required: true, 
        index: true,
        unique: false,
     },

     createdAt: {
        type: Date,
        default: Date.now,
    },

},{timestamps:true});
searchPostSchema.index({title:"text"})
searchPostSchema.index({createdAt:-1})


export default mongoose.model("Search", searchPostSchema);          