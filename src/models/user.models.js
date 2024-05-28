import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const saltRounds = 10;
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, // cloudinary url
      required: true,
    },
    avatarId: {
      type: String,
    },
    coverImage: {
      type: String,
    },
    coverImageId: {
      type: String,
    },
    watchHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    console.error("ERROR during encrypting password:", error);
    next(error);
  }
});

userSchema.methods.isPasswordCorrect = async function (password) {
  try {
    const match = await bcrypt.compare(password, this.password);
    return match;
  } catch (error) {
    console.log("Error during checking the password, ", error);
  }
};

userSchema.methods.generateAccessToken = function () {
  console.log("id in user schema", this._id);
  return new Promise((resolve, reject) => {
    jwt.sign(
      { _id: this._id, email: this.email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY },
      function (err, token) {
        if (err) {
          return reject(err);
        }
        console.log("token generated");
        resolve(token);
      }
    );
  });
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};

export const User = mongoose.model("User", userSchema);
