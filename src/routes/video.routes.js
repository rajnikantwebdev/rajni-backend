import { Router } from "express";
import {
  publishVideo,
  getAllVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  toggleVideoStatus,
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.route("/").get(getAllVideos);

router.route("/publishVideo").post(
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  publishVideo
);

router.route("/delete/:videoId").post(deleteVideo);
router.route("/get/video/:videoId").post(getVideoById);
router.route("/update/:videoId").post(updateVideo);
router.route("/toggle/:videoId").post(toggleVideoStatus);

export default router;
