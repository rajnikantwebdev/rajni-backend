import { Router } from "express";
import {
  publishPost,
  getAllPost,
  getVideoById,
  likePost,
  unlikePost,
} from "../controllers/post.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/getAllPost").get(getAllPost);

router
  .route("/publishPost")
  .post(verifyJWT, upload.single("image"), publishPost);

router.route("/get/video/:videoId").post(getVideoById);
router.route("/like/:postId").post(verifyJWT, likePost);
router.route("/unlike/:postId").post(verifyJWT, unlikePost);
export default router;
