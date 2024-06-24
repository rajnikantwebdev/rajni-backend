import { asyncHandler } from "../utils/asyncHandler.js";
import ApiErrors from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloud, removeFromCloud } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log(error);
    throw new ApiErrors(
      "Something went wrong while generating access and refresh token",
      500
    );
  }
};

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
  const { username, email, password } = req.body;
  if ([username, email, password].some((fields) => fields?.trim() === "")) {
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

  const user = await User.create({
    username: username.toLowerCase(),
    email,
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -avatarId -coverImageId"
  );
  // console.log("created-user: ", createdUser);
  if (!createdUser) {
    throw new ApiErrors("Something went wrong while registering the User", 500);
  }
  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User Created successfully"));
});

export const loginUser = asyncHandler(async (req, res) => {
  // check all the fields are filled
  // username or email checking
  // check if it exists
  // validate it matches from the database
  // generate a access token
  // generate the refresh token
  // send them in cookies
  const { email, password } = req.body;

  if ([email, password].some((value) => value.trim() === "")) {
    throw new ApiErrors("All fields are required", 400);
  }
  const userExists = await User.findOne({ email });
  if (!userExists) {
    throw new ApiErrors("User doesn't exists", 404);
  }

  const validatePassword = await userExists.isPasswordCorrect(password);

  if (!validatePassword) {
    throw new ApiErrors("Invalid credentials", 401);
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(userExists._id);

  const loggedInUser = await User.findById(userExists._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "Successful Logged in"
      )
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiErrors("Unauthorized access", 401);
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken._id);
    if (!user) {
      throw new ApiErrors("Invalid Refresh token", 401);
    }

    if (user?.refreshToken !== incomingRefreshToken) {
      throw new ApiErrors("Invalid Refresh token", 401);
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessTokenAndRefreshToken(user?._id);

    return res
      .status(200)
      .cookie("refreshToken", newRefreshToken, options)
      .cookie("accessToken", accessToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Token regenerated successfully"
        )
      );
  } catch (error) {
    console.log("error while refreshing token: ", error);
    throw new ApiErrors("Something went wrong", 401);
  }
});

export const changeUserCurrentPassword = asyncHandler(async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if ([oldPassword, newPassword].some((value) => value?.trim() === "")) {
      throw new ApiErrors("All fields are required", 401);
    }

    const user = await User.findById(req.user?._id);
    if (!user) {
      throw new ApiErrors("Unauthorized access", 404);
    }

    const isOldPasswordValid = await user.isPasswordCorrect(oldPassword);
    if (!isOldPasswordValid) {
      throw new ApiErrors("Invalid Password", 401);
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password Changed successfully"));
  } catch (error) {
    console.log("error while changing password", error);
    throw new ApiErrors("Unable to change password try again later", 401);
  }
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, "User found"));
});

export const updateAvatar = asyncHandler(async (req, res) => {
  const newAvatar = req.file?.path;
  const public_Id = req.user?.avatarId;
  console.log(public_Id);

  if (!newAvatar) {
    throw new ApiErrors("Avatar is required", 401);
  }

  const newAvatarCloud = await uploadOnCloud(newAvatar);
  if (!newAvatarCloud) {
    throw new ApiErrors("Unable to update Avatar", 500);
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: newAvatarCloud?.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  await removeFromCloud(public_Id);

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

export const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImage = req.file?.path;
  const public_Id = req.user?.coverImageId;
  if (!coverImage) {
    throw new ApiErrors("Cover image is missing", 401);
  }

  const coverImageCloud = await uploadOnCloud(coverImage);
  if (!coverImageCloud) {
    throw new ApiErrors("Unable to update cover image try again later", 500);
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { coverImage: coverImageCloud?.url } },
    { new: true }
  ).select("-password -refreshToken");

  await removeFromCloud(public_Id);

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image updated successfully"));
});

export const getChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const channel = await User.aggregate([
    {
      $match: { username: username?.toLowerCase() },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        channelSubscribedToCount: 1,
        isSubscribed: 1,
        createdAt: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiErrors("Channel does not exist", 404);
  }

  res
    .status(200)
    .json(new ApiResponse(200, channel[0], "Channel fetched successfully"));
});

export const getUserWatchHistory = asyncHandler(async (req, res) => {
  const watchHistory = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  console.log("watch-history: ", watchHistory);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        watchHistory[0].watchHistory,
        "Watch history fetched successfully"
      )
    );
});
