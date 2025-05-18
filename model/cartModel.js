// import mongoose from "mongoose";
// const cartSchema = new mongoose.Schema(
//   {
//     tableId: {
//       type: String,
//       required: true,
//     },
//     items: [
//       {
//         foodId: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "Food",
//           required: true,
//         },
//         quantity: {
//           type: Number,
//           required: true,
//           min: 1,
//         },
//       },
//     ],
//     totalAmount: {
//       type: Number,
//       default: 0,
//     },
//     status: {
//       type: String,
//       enum: ["active", "ordered", "cancelled"],
//       default: "active",
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// const Cart = mongoose.model("Cart", cartSchema);

// export default Cart;

// models/Cart.js
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
