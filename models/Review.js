const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, "Please provide product review rating"],
    },
    title: {
      type: String,
      trim: true,
      required: [true, "Please provide review title"],
      maxlength: 100,
    },
    comment: {
      type: String,
      required: [true, "Please provide review text"],
    },
    user: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    product: { type: mongoose.Types.ObjectId, ref: "Product", required: true },
  },
  { timestamps: true }
);

// Goal is to ensure user allowed only one review per product. One solution is compound index vs checks on controller
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Static method added to the Schema constructor.
ReviewSchema.statics.calculateAverageRating = async function (productId) {
  // 'this' in this.aggregate refer to the Model { Review }
  const result = await this.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        numOfReviews: { $sum: 1 },
      },
    },
  ]);

  // console.log(result); // [ { _id: null, averageRating: 4, numOfReviews: 2 } ] or []

  // There will be cases where there are no reviews for a specific product
  try {
    await this.model("Product").findOneAndUpdate(
      { _id: productId },
      {
        averageRating: Math.ceil(result[0]?.averageRating || 0), // Basically checks is result object present and if it is then get averateRating property else return 0 instead of just undefined.
        numOfReviews: result[0]?.numOfReviews || 0,
      }
    );
  } catch (error) {
    console.log(error);
  }
};

// Access static using this.constructor (in Mongoose)
ReviewSchema.post("save", async function () {
  await this.constructor.calculateAverageRating(this.product);
});

ReviewSchema.post("remove", async function () {
  await this.constructor.calculateAverageRating(this.product);
});

module.exports = mongoose.model("Review", ReviewSchema);
