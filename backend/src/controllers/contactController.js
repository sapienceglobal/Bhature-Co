import mongoose from 'mongoose';
import ContactMessage from '../models/ContactMessage.js';
import Restaurant from '../models/Restaurant.js';
import { AppError } from '../middleware/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';
import logger from '../utils/logger.js';

// @desc    submit a new contact message
// @route   POST /api/contact/public/contact
// @access  Public
export const submitContactMessage = asyncHandler(async (req, res, next) => {
  // Resolve restaurantId whether passed as ObjectId, slug, or omitted in single-restaurant mode
  let restaurantId = req.body.restaurantId;
  let resolvedRestaurant = null;

  if (restaurantId) {
    if (mongoose.Types.ObjectId.isValid(restaurantId)) {
      resolvedRestaurant = await Restaurant.findById(restaurantId).select('_id');
    }
    if (!resolvedRestaurant) {
      resolvedRestaurant = await Restaurant.findOne({ slug: restaurantId }).select('_id');
    }
  }

  if (!resolvedRestaurant) {
    resolvedRestaurant =
      (await Restaurant.findOne({ isActive: true }).select('_id')) ||
      (await Restaurant.findOne({ status: { $in: ['active', 'approved'] } }).select('_id')) ||
      (await Restaurant.findOne().select('_id'));
  }

  if (!resolvedRestaurant) {
    return next(new AppError('No active restaurant found', 404));
  }

  restaurantId = resolvedRestaurant._id;

  const { name, email, phone, subject, message } = req.body;

  const contactMessage = await ContactMessage.create({
    restaurant: restaurantId,
    name,
    email,
    phone: phone || '',
    subject,
    message
  });

  logger.info(`New contact message received from ${email} for restaurant ${restaurantId}`);

  res.status(201).json({
    success: true,
    data: contactMessage
  });
});

// @desc    get all contact messages for the logged-in merchant
// @route   GET /api/merchant/messages
// @access  Private (Merchant/Admin)
export const getMerchantMessages = asyncHandler(async (req, res, next) => {
  const restaurantId = req.user.restaurantId || req.query.restaurantId;

  if (!restaurantId && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to access messages without a restaurant', 403));
  }

  const query = restaurantId ? { restaurant: restaurantId } : {};

  // optional filtering by status
  if (req.query.status) {
    query.status = req.query.status;
  }

  const messages = await ContactMessage.find(query).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: messages.length,
    data: messages
  });
});

// @desc    update a contact message status
// @route   PATCH /api/merchant/messages/:id
// @access  Private (Merchant/Admin)
export const updateMessageStatus = asyncHandler(async (req, res, next) => {
  let message = await ContactMessage.findById(req.params.id);

  if (!message) {
    return next(new AppError(`No message found with ID ${req.params.id}`, 404));
  }

  // ensure user owns this restaurant's messages (unless admin)
  if (req.user.role !== 'admin' && message.restaurant.toString() !== req.user.restaurantId.toString()) {
    return next(new AppError('Not authorized to update this message', 403));
  }

  message = await ContactMessage.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: message
  });
});
