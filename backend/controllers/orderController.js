const Order = require('../models/Order');
const Product = require('../models/Product');
const { Op } = require('sequelize');

// Place a New Order
exports.placeOrder = async (req, res) => {
  try {
    const { phone, customer, amount, address, product, paymentType } = req.body;

    if (!phone || !customer || !amount || !address || !product) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields to complete the order!' });
    }
    
    // Generate Order ID (Format: #MF-YYMMDD-XXX)
    const today = new Date();
    const yy = String(today.getFullYear()).slice(-2);
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const rand = Math.floor(Math.random() * 900) + 100; // 3 digit random
    const orderId = `#MF-${yy}${mm}${dd}-${rand}`;

    const dateString = today.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    const newOrder = await Order.create({
      id: orderId,
      phone,
      customer,
      amount,
      payment: paymentType === 'paid' ? 'Paid' : 'Pending',
      paymentType: paymentType || 'pending',
      address,
      driver: 'Not assigned yet',
      estimate: paymentType === 'paid' ? 'Preparing order' : 'Waiting for payment verification',
      currentStep: paymentType === 'paid' ? 2 : 1, // Step 1: Verification, Step 2: Preparing
      product,
      date: dateString
    });

    return res.status(201).json({
      success: true,
      message: 'Your order has been placed successfully!',
      order: newOrder
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to place order.' });
  }
};

// Track Order (Public Endpoint - requires Order ID and Phone)
exports.trackOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { phone } = req.query;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Please enter Order ID!' });
    }

    const order = await Order.findByPk(orderId);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found! Please check the ID.' });
    }

    // Validate phone match if provided
    if (phone) {
      const cleanOrderPhone = order.phone.replace(/\D/g, '').replace(/^252|^0/, '');
      const cleanInputPhone = phone.replace(/\D/g, '').replace(/^252|^0/, '');
      
      if (cleanOrderPhone !== cleanInputPhone) {
        return res.status(400).json({ success: false, message: 'The phone number does not match this order!' });
      }
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to track order.' });
  }
};

// Get All Orders (Admin or Delivery)
exports.getOrders = async (req, res) => {
  try {
    const { role, firstName, lastName, phone } = req.user;
    let orders;

    if (role === 'admin') {
      // Admins see all orders
      orders = await Order.findAll({ order: [['createdAt', 'DESC']] });
    } else if (role === 'delivery') {
      // Delivery drivers see orders assigned to them
      // Match driver by name or phone or User ID
      const driverIdentifier = `${firstName} ${lastName}`;
      orders = await Order.findAll({
        where: {
          [Op.or]: [
            { driver: { [Op.like]: `%${driverIdentifier}%` } },
            { driver: { [Op.like]: `%${phone}%` } }
          ]
        },
        order: [['createdAt', 'DESC']]
      });
    } else {
      // Regular users see their own orders based on their phone number
      orders = await Order.findAll({
        where: { phone },
        order: [['createdAt', 'DESC']]
      });
    }

    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
};

// Update Order status / Assign driver (Admin or Delivery)
exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentStep, estimate, driver, payment, paymentType } = req.body;
    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found!' });
    }

    // Role-based validation
    if (req.user.role === 'delivery') {
      // Delivery drivers can only update step and estimate
      if (currentStep !== undefined) order.currentStep = parseInt(currentStep);
      if (estimate !== undefined) order.estimate = estimate;
      
      // Auto assign if delivery driver updates and order was unassigned
      if (order.driver === 'Not assigned yet' || !order.driver) {
        order.driver = `${req.user.firstName} ${req.user.lastName} - ${req.user.phone}`;
      }
    } else if (req.user.role === 'admin') {
      // Admins can update everything
      if (currentStep !== undefined) order.currentStep = parseInt(currentStep);
      if (estimate !== undefined) order.estimate = estimate;
      if (driver !== undefined) order.driver = driver;
      if (payment !== undefined) order.payment = payment;
      if (paymentType !== undefined) {
        order.paymentType = paymentType;
        if (paymentType === 'paid') {
          order.payment = 'Paid';
        } else if (paymentType === 'failed') {
          order.payment = 'Failed';
        }
      }
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Order updated successfully!',
      order
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to update order.' });
  }
};
