const Wishlist = require('../models/Wishlist');

exports.getWishlist = async (req, res) => {
  try {
    const doc = await Wishlist.findOne({ userId: req.user.id });
    return res.status(200).json({
      success: true,
      productTitles: doc?.productTitles || [],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to load wishlist.' });
  }
};

exports.syncWishlist = async (req, res) => {
  try {
    const { productTitles } = req.body;
    const titles = Array.isArray(productTitles) ? productTitles.filter(Boolean) : [];

    const doc = await Wishlist.findOneAndUpdate(
      { userId: req.user.id },
      { userId: req.user.id, productTitles: titles },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Wishlist saved.',
      productTitles: doc.productTitles,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to save wishlist.' });
  }
};

exports.toggleWishlistItem = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Product title is required.' });
    }

    let doc = await Wishlist.findOne({ userId: req.user.id });
    if (!doc) {
      doc = await Wishlist.create({ userId: req.user.id, productTitles: [title] });
      return res.status(200).json({ success: true, added: true, productTitles: doc.productTitles });
    }

    const exists = doc.productTitles.includes(title);
    if (exists) {
      doc.productTitles = doc.productTitles.filter((t) => t !== title);
    } else {
      doc.productTitles.push(title);
    }
    await doc.save();

    return res.status(200).json({
      success: true,
      added: !exists,
      productTitles: doc.productTitles,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to update wishlist.' });
  }
};
