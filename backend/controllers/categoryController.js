const Category = require('../models/Category');

function slugify(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

exports.getCategories = async (_req, res) => {
  try {
    const categories = await Category.find({ active: true }).sort({ order: 1, name: 1 });
    return res.status(200).json({ success: true, count: categories.length, categories });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to load categories.' });
  }
};

exports.getAllCategories = async (_req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1, name: 1 });
    return res.status(200).json({ success: true, count: categories.length, categories });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to load categories.' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description, image, order } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const slug = slugify(name);
    const exists = await Category.findOne({ slug });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Category already exists.' });
    }

    const category = await Category.create({
      id: `CAT-${Date.now()}`,
      name,
      slug,
      description: description || '',
      image: image || '',
      order: order || 0,
      active: true,
    });

    return res.status(201).json({ success: true, category });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to create category.' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findOne({ id: req.params.id });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const { name, description, image, order, active } = req.body;
    if (name) {
      category.name = name;
      category.slug = slugify(name);
    }
    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (order !== undefined) category.order = order;
    if (active !== undefined) category.active = active;

    await category.save();
    return res.status(200).json({ success: true, category });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to update category.' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({ id: req.params.id });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }
    return res.status(200).json({ success: true, message: 'Category deleted.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to delete category.' });
  }
};
