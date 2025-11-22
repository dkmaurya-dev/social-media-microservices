import express from "express";
import { createPost, getAllPosts, getPostById, updatePostById, deletePostById } from "../controller/post-controller.js";
import { authenticateRequest } from "../middleware/auth-middleware.js";
const postRouter = express.Router();
postRouter.use(authenticateRequest)
postRouter.post("/",createPost);
postRouter.route("/").get(getAllPosts);
postRouter.route("/:id").get(getPostById);
postRouter.route("/:id").put(updatePostById);
postRouter.delete("/:id",deletePostById);

export default postRouter;