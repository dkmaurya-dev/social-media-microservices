// user registration
import User from "../models/User.js";
import logger from "../utils/logger.js";
import { errorHandler } from "../middleware/errorHandler.js";
import { generateAuthToken } from "../utils/generateToken.js";
import {
  validateRegisterInput,
  validateLoginInput,
} from "../utils/validation.js";
const registerUser = async (req, res) => {
  logger.info("register called");
  try {
    const { error } = validateRegisterInput(req.body);
    if (error) {
      logger.warn("Validation Error", error.details[0].messgae);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { name, email, password } = req.body;
    let user = await User.findOne({ $or: [{ email }, { name }] });
    if (user) {
      logger.warn("User already Exists");
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    user = new User({ name, email, password });
    await user.save();
    logger.warn("User saved successfully", user._id);
    const { accessToken, refreshToken } = generateAuthToken(user);
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("Registration Error", error);
    errorHandler(error, req, res);
  }
};
// user login
const loginUser = async (req, res) => {
  logger.info("login called");
  try {
    const { error } = validateLoginInput(req.body);
    if (error) {
      logger.warn("Validation Error", error.details[0].messgae);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    if (!user) {
      logger.warn("User not found");
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched) {
      logger.warn("Invalid Password ");
      return res.status(400).json({
        success: false,
        message: "Invalid Password",
      });
    }

    const { accessToken, refreshToken } = generateAuthToken(user);
    res.status(201).json({
      success: true,
      message: "User Login successfully",
      accessToken,
      refreshToken,
      userId: user._id,
    });
  } catch (error) {
    logger.error("Login Error", error);
    errorHandler(error, req, res);
  }
};
// refresh token

const refreshTokenUser = async (req, res) => {
  logger.info("refresh called");
  try {
      const {refreshToken} = req.body
      const storeToken = await User.findOne({token:refreshToken})
      if(!storeToken||!storeToken.expiresAt<new Date()){
        logger.warn("Token expired");
        return res.status(400).json({
          success: false,
          message: "Token expired",
        });
      }
      let user = await User.findOne({ _id: storeToken.userId });
      if (!user) {  
        logger.warn("User not found");
        return res.status(400).json({
          success: false,
          message: "User not found",
        });
      }
      else{
        const { accessToken, refreshToken } = generateAuthToken(user);
        await storeToken.deleteOne({_id:storeToken._id})
        res.status(201).json({
          success: true,
          message: "Refresh Token Successfully",
          accessToken,
          refreshToken,
          userId: user._id,
        });
      }
  

 
  } catch (error) {
    logger.error("Refresh Token Error", error);
    errorHandler(error, req, res);
  }
};
// logout
const logoutUser = async (req, res) => {
  logger.info("logout called");
  try {
    const { refreshToken } = req.body;
    const storeToken = await User.findOne({ token: refreshToken });
    if (!storeToken) {
      logger.warn("Token not found");
      return res.status(400).json({
        success: false,
        message: "Token not found",
      });
    }
    await storeToken.deleteOne({ _id: storeToken._id });
    res.status(200).json({
      success: true,
      message: "Logout Successfully",
    });
  } catch (error) {
    logger.error("Logout Error", error);
    errorHandler(error, req, res);
  }
}
export { registerUser, loginUser,refreshTokenUser,logoutUser };
