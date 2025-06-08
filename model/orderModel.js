
import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  foodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Food",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
});

const orderSchema = new mongoose.Schema({
  tableId: {
    type: String,
    required: true,
  },
  sessionKey: {
    type: String,
    required: true, // Useful for debugging/grouping orders
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["completed", "cancelled"], // Only final outcomes
    required: true,
  },
  token: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: Date,
  completedAt: Date,
});

orderSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
