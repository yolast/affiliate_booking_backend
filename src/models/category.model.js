import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
    },
    description: {
      type: String,
      required: [true, "Category description is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Update the updatedAt field automatically whenever a category is updated
categorySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient querying
categorySchema.index({ name: 1 });
categorySchema.index({ parentCategory: 1 });

const Category = mongoose.model("Category", categorySchema);

export default Category;
