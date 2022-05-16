// const stripe  = require('stripe')(process.env.STRIPE_KEY) // normal setup

const Order = require("../models/Order");
const Product = require("../models/Product");

const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const { checkPermissions } = require("../utils");

const fakeStripeAPI = async ({ amount, currency }) => {
  const client_secret = "someRandomValue";
  return { client_secret, amount };
};

const createOrder = async (req, res) => {
  const { items: cartItems, tax, shippingFee } = req.body;

  if (!cartItems || cartItems.length < 1) {
    throw new CustomError.BadRequestError("No cart items provided");
  }

  if (!tax || !shippingFee) {
    throw new CustomError.BadRequestError(
      "Please provide tax and shipping fee"
    );
  }

  // __ Double check against database __
  // tax, shipping fees, list of items and amounts from the front-end
  // Goal - when 'Proceed To Checkout' clicked from front-end cart check below and for any issues do not allow user to see Stripe cc page.
  // Check product ids. Cannot use forEach nor map as we have to async operations inside of loop.
  let orderItems = [];
  let subtotal = 0;

  for (const item of cartItems) {
    const dbProduct = await Product.findOne({ _id: item.product });
    if (!dbProduct) {
      throw new CustomError.NotFoundError(
        `No product with id : ${item.product} `
      );
    }
    const { name, price, image, _id } = dbProduct;
    const singleOrderItem = {
      amount: item.amount,
      name,
      price,
      image,
      product: _id,
    };

    // add item to order, calculate subtotal
    orderItems = [...orderItems, singleOrderItem];
    subtotal += item.amount * price;
  }

  // calcualte total
  const total = tax + shippingFee + subtotal;

  // Communicate with Stripe to get client secret (normally)
  const paymentIntent = await fakeStripeAPI({
    amount: total,
    currency: "usd",
  });

  /* For normal stripe possible setup
  const paymentIntent = await stripe.paymentIntents.create({
    amount: total,
    currency: 'usd'
  })
  
  res.json({clientSecret: paymentIntent.client_secret}) // This is what the front-end needs when user enters cc and click pay.
  */

  // Create order
  const order = await Order.create({
    orderItems,
    total,
    subtotal,
    tax,
    shippingFee,
    clientSecret: paymentIntent.client_secret,
    user: req.user.userId,
  });

  // At this point only thing left user needs to do is pay with cc. With the
  // payment intent sent to the front-end now the front-end can communicate with Stripe.

  res
    .status(StatusCodes.CREATED)
    .json({ order, clientSecret: order.clientSecret }); // Front-end needs this clientSecret when they complete payment via 'submit' with cc info.
};

const getAllOrders = async (req, res) => {
  const orders = await Order.find({});

  res.status(StatusCodes.OK).json({ orders, count: orders.length });
};

const getSingleOrder = async (req, res) => {
  const { id: orderId } = req.params;
  const order = await Order.findOne({ _id: orderId });

  if (!order) {
    throw new CustomError.NotFoundError(`No order with id : ${orderId}`);
  }

  checkPermissions(req.user, order.user);

  res.status(StatusCodes.OK).json({ order });
};

const getCurrentUserOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user.userId });

  res.status(StatusCodes.OK).json({ orders, count: orders.length });
};

const updateOrder = async (req, res) => {
  const { id: orderId } = req.params;
  const { paymentIntentId } = req.body;

  const order = await Order.findOne({ _id: orderId });

  if (!order) {
    throw new CustomError.NotFoundError(`No order with id : ${orderId}`);
  }

  checkPermissions(req.user, order.user);

  order.paymentIntentId = paymentIntentId;
  order.status = "paid";
  await order.save();

  res.status(StatusCodes.OK).json({ order });
};

module.exports = {
  getAllOrders,
  getSingleOrder,
  getCurrentUserOrders,
  createOrder,
  updateOrder,
};
