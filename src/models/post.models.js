import { Schema, model } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
  {
    image: {
      type: String,
      required: [true, "image is required"],
    },
    caption: {
      type: String,
      required: true,
    },
    likesCount: {
      type: Number,
      required: true,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true, autoIndex: false }
);

videoSchema.index({ title: "text" });
videoSchema.plugin(mongooseAggregatePaginate);

export const Video = model("Video", videoSchema);
Video.createIndexes();
