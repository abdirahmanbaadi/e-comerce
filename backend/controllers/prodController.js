const Product = require('../models/Product');
const Review = require('../models/Review');
const Order = require('../models/Order');
const { onProductBackInStock } = require('../services/notificationService');
const { recordStockChange, getProductStockHistory } = require('../services/stockHistoryService');
const { getProductStockConsumption, getProductStockInventory } = require('../services/stockConsumptionService');
const { createStockBatch, reduceBatchesForAdjustment } = require('../services/stockBatchService');

function parseListParam(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function buildRatingFilter(ratings) {
  if (!ratings.length) return null;
  return {
    $or: ratings.map((raw) => {
      const rating = Number(raw);
      if (rating >= 5) return { rating: { $gte: 5 } };
      return { rating: { $gte: rating, $lt: rating + 1 } };
    }),
  };
}

function scoreProductForSearch(product, query) {
  const q = query.toLowerCase();
  let score = 0;
  const title = (product.title || '').toLowerCase();
  const material = (product.material || '').toLowerCase();
  const color = (product.color || '').toLowerCase();
  const description = (product.description || '').toLowerCase();

  if (title === q) score += 200;
  else if (title.startsWith(q)) score += 120;
  else if (title.includes(q)) score += 80;

  if ((product.label || '').toLowerCase().includes(q)) score += 40;
  if (material.includes(q)) score += 35;
  if (color.includes(q)) score += 25;
  if ((product.dimensions || '').toLowerCase().includes(q)) score += 20;
  if (description.includes(q)) score += 15;
  if ((product.materialType || '').toLowerCase().includes(q)) score += 15;

  return score;
}

// Get All Products (with filtering, sorting, searching)
exports.getProducts = async (req, res) => {
  try {
    const {
      category,
      materialType,
      search,
      sort,
      isNewest,
      stock,
      status,
      minPrice,
      maxPrice,
      rating,
    } = req.query;

    const andConditions = [];

    // Hide inactive catalog items on public storefront by default
    if (status) {
      andConditions.push({ status });
    } else {
      andConditions.push({ status: { $ne: 'Inactive' } });
    }

    const categories = parseListParam(category);
    if (categories.length === 1) andConditions.push({ category: categories[0] });
    else if (categories.length > 1) andConditions.push({ category: { $in: categories } });

    const materials = parseListParam(materialType);
    if (materials.length === 1) andConditions.push({ materialType: materials[0] });
    else if (materials.length > 1) andConditions.push({ materialType: { $in: materials } });

    const stockValues = parseListParam(stock);
    if (stockValues.length === 1) andConditions.push({ stock: stockValues[0] });
    else if (stockValues.length > 1) andConditions.push({ stock: { $in: stockValues } });

    if (isNewest === 'true') {
      andConditions.push({ isNewest: true });
    }

    const min = minPrice !== undefined && minPrice !== '' ? Number(minPrice) : null;
    const max = maxPrice !== undefined && maxPrice !== '' ? Number(maxPrice) : null;
    if (min !== null || max !== null) {
      const priceFilter = {};
      if (min !== null && !Number.isNaN(min)) priceFilter.$gte = min;
      if (max !== null && !Number.isNaN(max)) priceFilter.$lte = max;
      if (Object.keys(priceFilter).length) andConditions.push({ price: priceFilter });
    }

    const ratingFilter = buildRatingFilter(parseListParam(rating));
    if (ratingFilter) andConditions.push(ratingFilter);

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      andConditions.push({
        $or: [
          { title: searchRegex },
          { label: searchRegex },
          { material: searchRegex },
          { materialType: searchRegex },
          { color: searchRegex },
          { dimensions: searchRegex },
          { description: searchRegex },
        ],
      });
    }

    const filter = andConditions.length ? { $and: andConditions } : {};

    let sortClause = { popularity: -1 };
    const useRelevance = Boolean(search) && (!sort || sort === 'relevance');
    if (sort && sort !== 'relevance') {
      if (sort === 'price-low') sortClause = { price: 1 };
      else if (sort === 'price-high') sortClause = { price: -1 };
      else if (sort === 'rating') sortClause = { rating: -1 };
      else if (sort === 'newest') sortClause = { createdAt: -1 };
    }

    let products = await Product.find(filter).sort(sortClause).lean();

    if (useRelevance) {
      products = products
        .map((product) => ({
          product,
          score: scoreProductForSearch(product, search),
        }))
        .sort((a, b) => b.score - a.score || b.product.popularity - a.product.popularity)
        .map((row) => row.product);
    }

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to fetch products.' });
  }
};
 
 // Get Single Product by ID
 exports.getProductById = async (req, res) => {
   try {
     const product = await Product.findOne({ id: Number(req.params.id) });
     if (!product) {
       return res.status(404).json({ success: false, message: 'Product not found!' });
     }
     return res.status(200).json({ success: true, product });
   } catch (error) {
     console.error(error);
     return res.status(500).json({ success: false, message: 'Failed to fetch product details.' });
   }
 };

// Get Product Details with stats (Admin)
exports.getProductDetails = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const product = await Product.findOne({ id: productId });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found!' });
    }

    const [reviews, orderMatches] = await Promise.all([
      Review.find({ productId }).sort({ createdAt: -1 }).limit(10),
      Order.find({
        $or: [
          { 'items.id': productId },
          { product: product.title },
        ],
      }).sort({ createdAt: -1 }).limit(5),
    ]);

    const approvedReviews = reviews.filter((r) => r.status === 'approved');
    const avgRating =
      approvedReviews.length > 0
        ? approvedReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / approvedReviews.length
        : 0;

    const totalOrders = await Order.countDocuments({
      $or: [{ 'items.id': productId }, { product: product.title }],
    });

    return res.status(200).json({
      success: true,
      product,
      stats: {
        reviewCount: approvedReviews.length,
        pendingReviews: reviews.filter((r) => r.status === 'pending').length,
        avgRating: Math.round(avgRating * 10) / 10,
        totalOrders,
        stockVal: product.stockVal ?? 0,
        lowStock: (product.stockVal ?? 0) > 0 && (product.stockVal ?? 0) <= 5,
      },
      recentReviews: reviews.slice(0, 5).map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        status: r.status,
        userName: r.userName,
        createdAt: r.createdAt,
      })),
      recentOrders: orderMatches.map((o) => ({
        id: o.id,
        customer: o.customer,
        amount: o.amount,
        status: o.status,
        payment: o.payment,
        date: o.date,
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to fetch product details.' });
  }
};

const MIN_PRODUCT_IMAGES = 3;
const MAX_PRODUCT_IMAGES = 5;

function buildProductImagesFromRequest(req) {
  const files = req.files || [];
  let order = [];

  if (req.body.imagesOrder) {
    try {
      order =
        typeof req.body.imagesOrder === 'string'
          ? JSON.parse(req.body.imagesOrder)
          : req.body.imagesOrder;
    } catch {
      order = [];
    }
  }

  if (order.length > 0) {
    return order
      .map((slot) => {
        if (slot.type === 'file' && files[slot.index]) {
          return `uploads/${files[slot.index].filename}`;
        }
        if (slot.type === 'path' && slot.value) {
          return slot.value;
        }
        return null;
      })
      .filter(Boolean);
  }

  if (files.length > 0) {
    return files.map((file) => `uploads/${file.filename}`);
  }

  if (req.body.images) {
    return Array.isArray(req.body.images) ? req.body.images : JSON.parse(req.body.images);
  }

  return [];
}

function validateProductImages(productImages) {
  if (productImages.length < MIN_PRODUCT_IMAGES || productImages.length > MAX_PRODUCT_IMAGES) {
    return `Product must have ${MIN_PRODUCT_IMAGES} to ${MAX_PRODUCT_IMAGES} images.`;
  }
  return null;
}

function parseOptionalOldPrice(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = parseFloat(value);
  if (Number.isNaN(n) || n <= 0) return null;
  return n;
}

const MIN_PRODUCT_PRICE = 0.01;

function parseProductPrice(value) {
  const n = parseFloat(value);
  if (Number.isNaN(n) || n < MIN_PRODUCT_PRICE) return null;
  return n;
}

// Create Product (Admin Only)
exports.createProduct = async (req, res) => {
  try {
    const {
      title,
      category,
      label,
      materialType,
      materialLabel,
      material,
      price,
      oldPrice,
      discount,
      rating,
      popularity,
      isNewest,
      stockVal,
      color,
      dimensions,
      description,
      status,
      availability
    } = req.body;

    if (!title || !category || !color) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields!' });
    }

    const parsedPrice = parseProductPrice(price);
    if (parsedPrice == null) {
      return res.status(400).json({ success: false, message: `Price must be at least $${MIN_PRODUCT_PRICE.toFixed(2)}.` });
    }

    const productImages = buildProductImagesFromRequest(req);
    const imageError = validateProductImages(productImages);
    if (imageError) {
      return res.status(400).json({ success: false, message: imageError });
    }

    // Create the product
    const product = await Product.create({
      title,
      category,
      label: label || category.charAt(0).toUpperCase() + category.slice(1),
      materialType,
      materialLabel,
      material,
      price: parsedPrice,
      oldPrice: parseOptionalOldPrice(oldPrice),
      discount: discount || '',
      rating: parseFloat(rating) || 0,
      popularity: parseInt(popularity) || 50,
      isNewest: isNewest === 'true' || isNewest === true,
      stock: parseInt(stockVal) > 0 ? 'in-stock' : 'out-of-stock',
      stockVal: parseInt(stockVal) || 0,
      status: status || 'Active',
      availability: availability || (parseInt(stockVal) > 0 ? 'In Stock' : 'Out of Stock'),
      color,
      dimensions: dimensions || '',
      description: description || '',
      images: productImages,
    });

    return res.status(201).json({ success: true, message: 'New product added to database successfully!', product });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to add product.' });
  }
};

// Update Product (Admin Only)
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ id: Number(req.params.id) });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found!' });
    }

    const updateFields = { ...req.body };
    const wasOutOfStock = (product.stockVal ?? 0) <= 0 || product.stock === 'out-of-stock';

    delete updateFields.imagesOrder;

    // Parse numeric fields if they exist
    if (updateFields.price !== undefined) {
      const parsedPrice = parseProductPrice(updateFields.price);
      if (parsedPrice == null) {
        return res.status(400).json({ success: false, message: `Price must be at least $${MIN_PRODUCT_PRICE.toFixed(2)}.` });
      }
      updateFields.price = parsedPrice;
    }
    if (updateFields.oldPrice !== undefined) {
      updateFields.oldPrice = parseOptionalOldPrice(updateFields.oldPrice);
    }
    const previousStockVal = product.stockVal ?? 0;
    let nextStockVal = previousStockVal;

    if (updateFields.stockVal !== undefined) {
      nextStockVal = Math.max(0, parseInt(updateFields.stockVal, 10) || 0);
      updateFields.stockVal = nextStockVal;
      updateFields.stock = nextStockVal > 0 ? 'in-stock' : 'out-of-stock';
      updateFields.availability = nextStockVal > 0 ? 'In Stock' : 'Out of Stock';
    }

    if (updateFields.isNewest !== undefined) {
      updateFields.isNewest = updateFields.isNewest === 'true' || updateFields.isNewest === true;
    }

    if (req.files?.length || req.body.imagesOrder || req.body.images) {
      const productImages = buildProductImagesFromRequest(req);
      const imageError = validateProductImages(productImages);
      if (imageError) {
        return res.status(400).json({ success: false, message: imageError });
      }
      updateFields.images = productImages;
    } else {
      delete updateFields.images;
    }

    Object.assign(product, updateFields);
    await product.save();

    let lastStockChange = null;
    let lastStockBatch = null;
    if (updateFields.stockVal !== undefined && nextStockVal !== previousStockVal) {
      const delta = nextStockVal - previousStockVal;
      await recordStockChange({
        product,
        previousStock: previousStockVal,
        newStock: nextStockVal,
        user: req.user,
        source: 'admin_manual',
      });
      if (delta > 0) {
        lastStockBatch = await createStockBatch({
          product,
          unitsAdded: delta,
          stockBefore: previousStockVal,
          stockAfter: nextStockVal,
          user: req.user,
          source: 'admin_manual',
        });
      } else if (delta < 0) {
        await reduceBatchesForAdjustment(product.id, Math.abs(delta));
      }
      const history = await getProductStockHistory(product.id, { limit: 1 });
      lastStockChange = history[0] || null;
    }

    const nowInStock = (product.stockVal ?? 0) > 0 && product.stock === 'in-stock';
    if (wasOutOfStock && nowInStock) {
      onProductBackInStock(product).catch((err) => console.error('Wishlist stock notification failed:', err));
    }

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully!',
      product,
      lastStockChange,
      lastStockBatch,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to update product.' });
  }
};

// Product stock change history (Admin Only)
exports.getProductStockHistory = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const product = await Product.findOne({ id: productId }).select('id title').lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found!' });
    }

    const limit = Number(req.query.limit) || 30;
    const history = await getProductStockHistory(productId, { limit });

    return res.status(200).json({
      success: true,
      productId: product.id,
      productTitle: product.title,
      history,
      lastChange: history[0] || null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to load stock history.' });
  }
};

// Product stock inventory — batches + consumption (Admin Only)
exports.getProductStockInventory = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const result = await getProductStockInventory(productId);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Product not found!' });
    }
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to load stock inventory.' });
  }
};

// Product stock consumption / sales breakdown (Admin Only)
exports.getProductStockConsumption = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const limit = Number(req.query.limit) || 50;
    const batchId = req.query.batchId || '';
    const result = await getProductStockConsumption(productId, { limit, batchId });

    if (!result) {
      return res.status(404).json({ success: false, message: 'Product not found!' });
    }

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to load stock consumption.' });
  }
};

// Delete Product (Admin Only)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ id: Number(req.params.id) });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found!' });
    }

    await Product.deleteOne({ id: Number(req.params.id) });
    return res.status(200).json({ success: true, message: 'Product deleted from database successfully!' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
};
