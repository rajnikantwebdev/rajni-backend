import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";
import ApiErrors from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloud } from "../utils/cloudinary.js";

export const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 2,
    query = "missed",
    sortBy = "-createdAt",
    sortType,
    userId,
  } = req.query;
  const videoAggregation =
    query === ""
      ? Video.aggregate()
      : Video.aggregate([
          {
            $match: { $text: { $search: query } },
          },
        ]);

  let data;
  const videos = await Video.aggregatePaginate(videoAggregation, {
    page,
    limit,
    sort: sortBy,
  })
    .then((result) => {
      data = result;
    })
    .catch((err) => {
      console.log("err", err);
      throw new ApiErrors("Unable to fetch videos", 500);
    });
  res
    .status(200)
    .json(new ApiResponse(200, data, "All video fetched successfully"));
});

export const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if ([title, description].some((value) => value.trim() === "")) {
    throw new ApiErrors("All fields are required", 401);
  }

  const videoLocalPath = req?.files?.videoFile[0]?.path;
  if (!videoLocalPath) {
    throw new ApiErrors("Video File is required", 401);
  }
  const thumbnailLocalPath = req?.files?.thumbnail[0]?.path;

  if (!thumbnailLocalPath) {
    throw new ApiErrors("Thumbnail is required", 401);
  }
  const videoCloud = uploadOnCloud(videoLocalPath);
  const thumbnailCloud = uploadOnCloud(thumbnailLocalPath);

  const uploadVideoAndThumbnail = await Promise.all([
    videoCloud,
    thumbnailCloud,
  ]);

  if (!uploadVideoAndThumbnail) {
    throw new ApiErrors("Unable to upload video file try again later", 500);
  }

  const video = await Video.create({
    title: title,
    description: description,
    videoFile: uploadVideoAndThumbnail[0]?.url,
    thumbnail: uploadVideoAndThumbnail[1]?.url,
    duration: Math.round(uploadVideoAndThumbnail[0]?.duration / 60),
    isPublished: true,
    owner: req.user?._id,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, { video }, "Video is uploaded Successfully"));
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

export const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  const { title, description } = req.body;
  console.log(req.body);
  if ([title, description].some((value) => value.trim() == "")) {
    throw new ApiErrors("All fields are required", 401);
  }
  const thumbnail = req?.files?.thumbnail?.[0]?.path;

  if (!thumbnail) {
    throw new ApiErrors("Thumbnail is required", 401);
  }

  const thumbnailUrl = await uploadOnCloud(thumbnail);
  if (!thumbnailUrl) {
    throw new ApiErrors("Unable to upload thumbnail, try again later", 401);
  }

  const updatedVideo = await Video.findOneAndUpdate(
    { _id: videoId },
    { title: title, description: description, thumbnail: thumbnail?.url },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

export const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  console.log("video id: ", videoId);

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiErrors("Unable to find video", 401);
  }

  const result = await Video.findByIdAndDelete(videoId);

  res
    .status(200)
    .json(new ApiResponse(200, result, "Video deleted succedssfully"));
});

export const toggleVideoStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiErrors("Unable to find video", 401);
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video.isPublished,
      },
    },
    {
      new: true,
    }
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedVideo,
        updatedVideo.isPublished
          ? "Video Published Successfully"
          : "Unpublished successfully"
      )
    );
});
