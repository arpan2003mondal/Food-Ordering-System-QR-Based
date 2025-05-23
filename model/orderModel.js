// import mongoose from "mongoose";

// const orderSchema = new mongoose.Schema(
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
//         },
//       },
//     ],
//     totalAmount: {
//       type: Number,
//       required: true,
//     },
//     status: {
//       type: String,
//       enum: ["pending", "paid", "completed"],
//       default: "pending",
//     },
//     paymentStatus: {
//       type: String,
//       enum: ["not_paid", "processing", "paid", "failed"],
//       default: "not_paid",
//     },
//     paymentId: {
//       type: String,
//     },
//   },
//   { timestamps: true }
// );

// const Order = mongoose.model("Order", orderSchema);

// export default Order;

// models/Order.js
import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  foodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Food",
    required: true
  },
  quantity: {
    type: Number,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  tableId: {
    type: String,
    required: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "cancelled", "accepted", "ready", "completed"],
    default: "pending"
  },
  token: {
  type: Number,
  required: true
},
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
