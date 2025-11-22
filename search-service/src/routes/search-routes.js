import express from "express";
import {searchPost,getAllSearch} from "../controller/search-controller.js";    
import { authenticateRequest } from "../middleware/auth-middleware.js";
import search from "../models/search.js";
const searchRouter = express.Router();

searchRouter.use(authenticateRequest);
searchRouter.get("/posts", searchPost);
searchRouter.get("/get-all-search", getAllSearch);

export default searchRouter;