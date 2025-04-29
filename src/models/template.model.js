import mongoose from "mongoose";

const templateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Template name is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["A", "B", "C"],
      required: [true, "Template type is required"],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    structure: {
      sections: [
        {
          name: String,
          label: String,
          type: {
            type: String,
            enum: [
              "text",
              "gallery",
              "description",
              "pricing",
              "booking_fields",
              "location",
            ],
          },
          isRequired: Boolean,
          maxItems: Number, // For gallery or multiple descriptions
          options: [String], // For predefined options
        },
      ],
    },
    defaultCommissionStructure: {
      affiliateCommission: {
        type: Number,
        required: [true, "Default affiliate commission is required"],
      },
      dsaCommission: {
        type: Number,
        default: 0,
      },
      ssaCommission: {
        type: Number,
        default: 0,
      },
      nsaCommission: {
        type: Number,
        default: 0,
      },
      isPercentage: {
        type: Boolean,
        default: true,
      },
    },
    defaultBookingFields: [
      {
        name: String,
        label: String,
        type: {
          type: String,
          enum: ["text", "number", "date", "time", "select", "checkbox"],
        },
        isRequired: Boolean,
        options: [String], // For select fields
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "Creator admin reference is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Template = mongoose.model("Template", templateSchema);

export default Template;
