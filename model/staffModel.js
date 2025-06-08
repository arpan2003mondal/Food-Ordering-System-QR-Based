import mongoose from "mongoose";

const staffSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true }, 
    password: { type: String, required: true },
    role: { type: String, default: "staff" },
    salary: { type: Number, required: false, default: 0 },
  },
  {
    timestamps: true,
  }
);

const staffModel = mongoose.model("Staff", staffSchema);
export default staffModel;
