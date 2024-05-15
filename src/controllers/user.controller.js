import { asyncHandler } from "../utils/asyncHandler.js";
import ApiErrors from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloud } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const registerUser = asyncHandler(async (req, res) => {
  // get the body
  // validation
  // check if user already exits
  //   check for images  // check for avatar
  //   upload to cloud
  //   create the user obj -  // create it on database
  //   remove password and refresh token from response
  //   check for user creation
  // return res
  const { username, email, fullName, password } = req.body;
  if (
    [username, email, fullName, password].some(
      (fields) => fields?.trim() === ""
    )
  ) {
    throw new ApiErrors("All fields are required", 400);
  }
  if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g.test(email)) {
    throw new ApiErrors("Invalid Email", 400);
  }
  const existedUser = await User.findOne({
    $or: [{ email: email }, { username: username }],
  });
  console.log("existed-user: ", existedUser);
  if (existedUser) {
    throw new ApiErrors("User already Exists", 409);
  }
  console.log("avatar: ", req?.files?.avatar);
  const avatarLocalPath = req?.files?.avatar[0]?.path;
  const coverImageLocalPath = req?.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiErrors("Avatar is required", 400);
  }

  const avatar = await uploadOnCloud(avatarLocalPath);
  console.log("cloud-avatar: ", avatar);
  const coverImage = await uploadOnCloud(coverImageLocalPath);
  console.log("cloud-coverimage: ", coverImage);

  if (!avatar) {
    throw new ApiErrors("Avatar is required", 400);
  }

  const user = await User.create({
    username: username.toLowerCase(),
    email,
    fullName,
    password,
    avatar: avatar.url,
    coverImage: coverImage.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  console.log("created-user: ", createdUser);
  if (!createdUser) {
    throw new ApiErrors("Something went wrong while registering the User", 500);
  }
  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User Created successfully"));
});
