import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/post.models.js";
import ApiErrors from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloud } from "../utils/cloudinary.js";

export const getAllPost = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const videoAggregation = Video.aggregate();

  let data;
  const posts = await Video.aggregatePaginate(videoAggregation, {
    page,
    limit,
  })
    .then((result) => {
      data = result;
    })
    .catch((err) => {
      console.log("err", err);
      throw new ApiErrors("Unable to fetch post", 500);
    });
  res
    .status(200)
    .json(new ApiResponse(200, data, "All post fetched successfully"));
});

export const publishPost = asyncHandler(async (req, res) => {
  const { caption } = req.body;
  const img = req?.file?.path;

  if (!caption || !img) {
    throw new ApiErrors("All fields are required", 401);
  }

  const imageCloud = await uploadOnCloud(img);
  if (!imageCloud) {
    throw new ApiErrors("Unable to upload image try again later", 500);
  }

  const post = await Video.create({
    image: imageCloud?.url,
    caption: caption,
    likesCount: 0,
    isPublished: true,
    owner: req.user?._id,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, { post }, "Post is uploaded Successfully"));
});

export const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  //find a video using it's id.
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiErrors("Unable to find the video", 500);
  }
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

export const likePost = asyncHandler(async (req, res) => {
  const userId = req?.user?._id;
  console.log("userId: ", userId);
  const postId = req.params.postId;

  const post = await Video.findById(postId);
  if (!post) {
    throw new ApiErrors("Post not found", 404);
  }

  if (post.likes.includes(userId)) {
    throw new ApiErrors("You have already liked this post", 400);
  }

  post.likes.push(userId);
  post.likesCount = post.likes.length;
  await post.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { post }, "Post liked successfully"));
});

export const unlikePost = asyncHandler(async (req, res) => {
  const userId = req?.user?._id;
  const postId = req.params.postId;

  const post = await Video.findById(postId);
  if (!post) {
    throw new ApiErrors("Post not found", 404);
  }

  if (!post.likes.includes(userId)) {
    throw new ApiErrors("You have not liked this post", 400);
  }

  post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
  post.likesCount = post.likes.length;
  await post.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { post }, "Post unliked successfully"));
});
