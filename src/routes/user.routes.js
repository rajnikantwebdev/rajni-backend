import { Router } from "express";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  changeUserCurrentPassword,
  getCurrentUser,
  updateAvatar,
  updateCoverImage,
  getChannelProfile,
  getUserWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);
// secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router
  .route("/change-current-password")
  .post(verifyJWT, changeUserCurrentPassword);

router.route("/currentUser").get(verifyJWT, getCurrentUser);

router
  .route("/updateAvatar")
  .patch(verifyJWT, upload.single("avatar"), updateAvatar);

router
  .route("/updateCoverImage")
  .patch(verifyJWT, upload.single("coverImage"), updateCoverImage);

router.route("/channel/:username").get(verifyJWT, getChannelProfile);
router.route("/watchHistory").get(verifyJWT, getUserWatchHistory);

export default router;
