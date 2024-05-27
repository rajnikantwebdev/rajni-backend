import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import ApiErrors from "../utils/ApiError.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies.accessToken ||
      req.headers("Authorization")?.replace("Bearer ", "");

    console.log("token: ", req.cookies);
    if (!token) {
      throw new ApiErrors("Unauthorized access", 401);
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log("decoded-token", decodedToken);
    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiErrors("Invalid access token", 401);
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiErrors(error?.message || "Invalid access token", 401);
  }
});
