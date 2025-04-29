import mongoose from "mongoose";

const serviceScherma = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Template",
      required: [true, "Template reference is required"],
    },
    serviceProvider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Service provider reference is required"],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    gallery: [
      {
        url: String,
        caption: String,
      },
    ],
    descriptions: [
      {
        title: String,
        content: String,
      },
    ],
    pricing: {
      basePrice: {
        type: Number,
        required: [true, "Base price is required"],
      },
      discountPercentage: {
        type: Number,
        default: 0,
      },
      isDynamicPricing: {
        type: Boolean,
        default: false,
      },
      dynamicPricingRules: [
        {
          condition: String,
          adjustment: Number,
          isPercentage: Boolean,
        },
      ],
    },
    commissionStructure: {
      affiliateCommission: {
        type: Number,
        required: [true, "Affiliate commission is required"],
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
    bookingFields: [
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
    location: {
      address: String,
      city: String,
      state: String,
      district: String,
      pincode: String,
      country: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    availability: {
      daysOfWeek: [
        {
          type: Number, // 0-6 (Sunday-Saturday)
          enum: [0, 1, 2, 3, 4, 5, 6],
        },
      ],
      timeSlots: [
        {
          startTime: String, // HH:MM format
          endTime: String, // HH:MM format
          maxBookings: Number,
        },
      ],
      exceptions: [
        {
          date: Date,
          isAvailable: Boolean,
          timeSlots: [
            {
              startTime: String,
              endTime: String,
              maxBookings: Number,
            },
          ],
        },
      ],
    },
    status: {
      type: String,
      enum: ["draft", "pending_approval", "approved", "rejected", "inactive"],
      default: "draft",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    approvalDate: Date,
    rejectionReason: String,
    isPromoted: {
      type: Boolean,
      default: false,
    },
    promotionPriority: {
      type: Number,
      default: 0,
    },
    ratings: {
      average: {
        type: Number,
        default: 0,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    totalBookings: {
      type: Number,
      default: 0,
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

// Method to calculate final price with discounts
serviceScherma.methods.calculateFinalPrice = function (bookingDetails = {}) {
  let finalPrice = this.pricing.basePrice;

  // Apply standard discount
  if (this.pricing.discountPercentage > 0) {
    finalPrice -= (finalPrice * this.pricing.discountPercentage) / 100;
  }

  // Apply dynamic pricing if enabled
  if (
    this.pricing.isDynamicPricing &&
    this.pricing.dynamicPricingRules.length > 0
  ) {
    for (const rule of this.pricing.dynamicPricingRules) {
      // Evaluate the condition (simplified for example)
      // In a real implementation, you would use a more sophisticated approach
      // to evaluate conditions based on booking details
      const conditionMet = evaluateCondition(rule.condition, bookingDetails);

      if (conditionMet) {
        if (rule.isPercentage) {
          finalPrice += (finalPrice * rule.adjustment) / 100;
        } else {
          finalPrice += rule.adjustment;
        }
      }
    }
  }

  return Math.max(0, finalPrice);
};

// Helper function to evaluate dynamic pricing conditions
function evaluateCondition(condition, bookingDetails) {
  // This is a simplified implementation
  // In a real application, you would implement a more robust condition evaluator
  // that can handle various conditions like date ranges, number of people, etc.

  // Example: "weekday" condition
  if (condition === "weekday" && bookingDetails.date) {
    const date = new Date(bookingDetails.date);
    const day = date.getDay();
    return day >= 1 && day <= 5; // Monday to Friday
  }

  // Example: "weekend" condition
  if (condition === "weekend" && bookingDetails.date) {
    const date = new Date(bookingDetails.date);
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }

  // Example: "group_size_large" condition
  if (condition === "group_size_large" && bookingDetails.groupSize) {
    return bookingDetails.groupSize > 5;
  }

  return false;
}

// Method to check if a time slot is available
serviceScherma.methods.isTimeSlotAvailable = async function (
  date,
  startTime,
  endTime
) {
  // Implementation would check against existing bookings
  // This is a placeholder for the actual implementation
  return true;
};

// Index for efficient querying
serviceScherma.index({ category: 1, status: 1 });
serviceScherma.index({
  "location.district": 1,
  "location.state": 1,
  status: 1,
});
serviceScherma.index({ serviceProvider: 1 });

const Service = mongoose.model("Service", serviceScherma);

export default Service;
