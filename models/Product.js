const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "Please provide product name"],
      maxlength: [100, "Name cannot be more than 100 characters"],
    },
    price: {
      type: Number,
      required: [true, "Please provide product price"],
      default: 0,
    },
    description: {
      type: String,
      required: [true, "Please provide product description"],
      maxlength: [1000, "Description cannot be more than 1000 characters"],
    },
    image: {
      type: String,
      default: "/uploads/example.jpeg",
    },
    category: {
      type: String,
      required: [true, "Please provide product category"],
      enum: ["office", "kitchen", "bedroom"],
    },
    company: {
      type: String,
      required: [true, "Please provide product company"],
      enum: {
        values: ["ikea", "liddy", "marcos"],
        message: "{VALUE} is not supported",
      },
    },
    colors: {
      type: [String],
      default: ["#222"],
      required: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    freeShipping: {
      type: Boolean,
      default: false,
    },
    inventory: {
      type: Number,
      required: true,
      default: 15,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    numOfReviews: {
      type: Number,
      default: 0,
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

ProductSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "product",
  justOne: false,
  // match: { rating: 5 },
});

ProductSchema.pre("remove", async function (next) {
  await this.model("Review").deleteMany({ product: this._id });
});

module.exports = mongoose.model("Product", ProductSchema);

/* Virtuals
  Note - Very important - This is a virtual property and that means we cannot query it.
  We cannot not set up queries on the reviews that are associated to a product because
  Review model is not reference anywhere in the Product model.

  toJSON: { virtuals: true }, toObject: { virtuals: true }
  - What if we want to get all reviews associated to a product?
  - Not in Product model we do not have a specific ref set up to Reviews model
  - and therefore cannot use .populate unless we set up virtuals.
  - So we 
    - 1 set up this Product model to accept Mongoose virtuals.
    - 2 create virtual property in this schema with a specific name ex: 'reviews'
    - 3 in productController we chain on .populate('reviews')

    // Set up the virtual connection
    ProductSchema.virtual("reviews", {
      ref: "Review",  // model
      localField: "_id", // Product._id property
      foreignField: "product", // Review.product property
      justOne: false, // To get a list
      match: { rating: 5 } // Filter and get only documents equal to five
    });
*/

/* .model() function
  this.model('Access a different model')
*/
