import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    tableId: {
      type: String,
      required: true,
    },
    items: [
      {
        foodId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Food",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "completed"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["not_paid", "processing", "paid", "failed"],
      default: "not_paid",
    },
    paymentId: {
      type: String,
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
