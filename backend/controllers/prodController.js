const Product = require('../models/Product');
const { Op } = require('sequelize');

// Get All Products (with filtering, sorting, searching)
exports.getProducts = async (req, res) => {
  try {
    const { category, materialType, search, sort, isNewest, stock } = req.query;
    const whereClause = {};

    // Filter by Category
    if (category) {
      whereClause.category = category;
    }

    // Filter by Material Type
    if (materialType) {
      whereClause.materialType = materialType;
    }

    // Filter by Stock Status
    if (stock) {
      whereClause.stock = stock;
    }

    // Filter by isNewest
    if (isNewest === 'true') {
      whereClause.isNewest = true;
    }

    // Filter by Search Query
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { material: { [Op.like]: `%${search}%` } },
        { color: { [Op.like]: `%${search}%` } }
      ];
    }

    // Sorting Logic
    let orderClause = [['popularity', 'DESC']]; // default sorting
    if (sort) {
      if (sort === 'price-low') {
        orderClause = [['price', 'ASC']];
      } else if (sort === 'price-high') {
        orderClause = [['price', 'DESC']];
      } else if (sort === 'rating') {
        orderClause = [['rating', 'DESC']];
      } else if (sort === 'newest') {
        orderClause = [['createdAt', 'DESC']];
      }
    }

    const products = await Product.findAll({
      where: whereClause,
      order: orderClause
    });

    return res.status(200).json({ success: true, count: products.length, products });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to fetch products.' });
  }
 };
 
 // Get Single Product by ID
 exports.getProductById = async (req, res) => {
   try {
     const product = await Product.findByPk(req.params.id);
     if (!product) {
       return res.status(404).json({ success: false, message: 'Product not found!' });
     }
     return res.status(200).json({ success: true, product });
   } catch (error) {
     console.error(error);
     return res.status(500).json({ success: false, message: 'Failed to fetch product details.' });
   }
 };

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
      status,
      availability
    } = req.body;

    if (!title || !category || !price || !color) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields!' });
    }

    // Process image paths
    let productImages = [];
    if (req.files && req.files.length > 0) {
      // Map uploaded files to URL paths relative to the server
      productImages = req.files.map(file => `uploads/${file.filename}`);
    } else if (req.body.images) {
      // If image paths were passed directly (e.g. seeding or URL references)
      productImages = Array.isArray(req.body.images) ? req.body.images : JSON.parse(req.body.images);
    }

    // Create the product
    const product = await Product.create({
      title,
      category,
      label: label || category.charAt(0).toUpperCase() + category.slice(1),
      materialType,
      materialLabel,
      material,
      price: parseFloat(price),
      oldPrice: oldPrice ? parseFloat(oldPrice) : null,
      discount: discount || '',
      rating: parseFloat(rating) || 4.0,
      popularity: parseInt(popularity) || 50,
      isNewest: isNewest === 'true' || isNewest === true,
      stock: parseInt(stockVal) > 0 ? 'in-stock' : 'out-of-stock',
      stockVal: parseInt(stockVal) || 0,
      status: status || 'Active',
      availability: availability || (parseInt(stockVal) > 0 ? 'In Stock' : 'Out of Stock'),
      color,
      images: productImages
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
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found!' });
    }

    const updateFields = { ...req.body };

    // Parse numeric fields if they exist
    if (updateFields.price) updateFields.price = parseFloat(updateFields.price);
    if (updateFields.oldPrice) updateFields.oldPrice = parseFloat(updateFields.oldPrice);
    if (updateFields.stockVal) {
      updateFields.stockVal = parseInt(updateFields.stockVal);
      updateFields.stock = updateFields.stockVal > 0 ? 'in-stock' : 'out-of-stock';
      updateFields.availability = updateFields.stockVal > 0 ? 'In Stock' : 'Out of Stock';
    }

    // Process new uploaded images if any
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `uploads/${file.filename}`);
      updateFields.images = newImages;
    } else if (req.body.images) {
      updateFields.images = Array.isArray(req.body.images) ? req.body.images : JSON.parse(req.body.images);
    }

    await product.update(updateFields);

    return res.status(200).json({ success: true, message: 'Product updated successfully!', product });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to update product.' });
  }
};

// Delete Product (Admin Only)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found!' });
    }

    await product.destroy();
    return res.status(200).json({ success: true, message: 'Product deleted from database successfully!' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
};
