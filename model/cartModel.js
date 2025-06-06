import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  foodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Food",
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
});

const cartSchema = new mongoose.Schema({
  tableId: {
    type: String,
    required: true
  },
  sessionKey: {
    type: String,
    required: true,
    index: true // Add index for faster lookup
  },
  items: [cartItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["active", "ordered"],
    default: "active"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
