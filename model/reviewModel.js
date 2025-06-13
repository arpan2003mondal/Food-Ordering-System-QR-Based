import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    foodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    reviewText: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Optional: You can enforce one review per user per food if needed later
// reviewSchema.index({ foodId: 1, userId: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);

export default Review;
