/** Block admin & driver from customer cart, wishlist, and checkout APIs */

function rejectStaffShopping(req, res, next) {
  const role = req.user?.role;
  if (role === 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin accounts cannot use cart or checkout. Use View Store for preview only.',
    });
  }
  if (role === 'delivery') {
    return res.status(403).json({
      success: false,
      message: 'Delivery driver accounts cannot shop on the storefront.',
    });
  }
  return next();
}

module.exports = { rejectStaffShopping };
