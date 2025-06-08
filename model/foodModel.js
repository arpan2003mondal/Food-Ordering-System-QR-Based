import mongoose from "mongoose";

const foodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: [ "Pizza",
    "Burger",
    "Biryani",
    "Rice & Pulao",
    "Paratha",
    "Rolls & Wraps",
    "North Indian",
    "South Indian",
    "Chinese",
    "Snacks & Street Food",
    "Sandwich",
    "Tandoori",
    "Momos",
    "Chaat",
    "Thali Combo Meals",
    "Curries Gravies",
    "Fries & Sides",
    "Desserts & Sweets",
    "Ice Cream & Kulfi",
    "Beverages",
    "Others"]
    },
    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    imageUrl: { type: String, required: true },
    ingredients: { type: String, default : "No Ingredients Details Available"},
    isVegetarian: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

const Food = mongoose.model("Food", foodSchema);

export default Food;
