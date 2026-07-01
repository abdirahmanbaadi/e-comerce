/**
 * Wishlist Modal & Integration JavaScript
 * Handles dynamic modal injection, rendering, item addition/removal,
 * cart integration, and seamless details modal navigation.
 */

(function () {
    const defaultProducts = [
        {
            id: 1,
            title: "Bloom Accent Chair Set",
            category: "chair",
            label: "Chair",
            materialType: "linen",
            materialLabel: "Linen Fabric",
            material: "Premium Oak Frame, Linen Fabric",
            price: 0.01,
            oldPrice: 0.02,
            discount: "10% off",
            rating: 3.8,
            popularity: 82,
            isNewest: true,
            stock: "in-stock",
            stockVal: 12,
            status: "Active",
            availability: "In Stock",
            color: "Sand Beige",
            images: [
                "chair/bloom-round-accent-chair-set-main.jpeg.png",
                "chair/bloom-round-accent-chair-set-angle-1.jpeg.png",
                "chair/bloom-round-accent-chair-set-angle-2.jpeg.png",
                "chair/bloom-round-accent-chair-set-angle-3.jpeg.png"
            ]
        },
        {
            id: 2,
            title: "Olive Curve Lounge Chair",
            category: "chair",
            label: "Chair",
            materialType: "velvet",
            materialLabel: "Velvet",
            material: "Velvet Luxury Fiber, Wood Frame",
            price: 0.01,
            oldPrice: null,
            discount: "",
            rating: 4.2,
            popularity: 72,
            isNewest: false,
            stock: "out-of-stock",
            stockVal: 0,
            status: "Active",
            availability: "Out of Stock",
            color: "Olive Green",
            images: [
                "chair/olive-curve-lounge-chair-main.jpeg.png",
                "chair/olive-curve-lounge-chair-angle-1.jpeg.png",
                "chair/olive-curve-lounge-chair-angle-2.jpeg.png",
                "chair/olive-curve-lounge-chair-angle-3.jpeg.png"
            ]
        },
        {
            id: 3,
            title: "Blush Velvet Arch Bed",
            category: "bedroom",
            label: "Bedroom",
            materialType: "velvet",
            materialLabel: "Velvet",
            material: "Premium Velvet, Solid Wood Frame",
            price: 0.01,
            oldPrice: 0.02,
            discount: "10% off",
            rating: 4.8,
            popularity: 90,
            isNewest: true,
            stock: "in-stock",
            stockVal: 8,
            status: "Active",
            availability: "In Stock",
            color: "Blush Pink",
            images: [
                "bedroom/blush-velvet-arch-bed-main.jpeg.jpeg",
                "bedroom/blush-velvet-arch-bed-angle-1.jpeg.jpeg",
                "bedroom/blush-velvet-arch-bed-angle-2.jpeg.jpeg",
                "bedroom/blush-velvet-arch-bed-main.jpeg.jpeg"
            ]
        },
        {
            id: 4,
            title: "Sage Wood Platform Bed",
            category: "bedroom",
            label: "Bedroom",
            materialType: "wood",
            materialLabel: "Wood",
            material: "Solid Wood, Sage Green Finish",
            price: 0.01,
            oldPrice: 0.02,
            discount: "15% off",
            rating: 4.5,
            popularity: 85,
            isNewest: false,
            stock: "in-stock",
            stockVal: 14,
            status: "Active",
            availability: "In Stock",
            color: "Sage Green & Natural Wood",
            images: [
                "bedroom/sage-wood-platform-bed-main.jpeg.jpeg",
                "bedroom/sage-wood-platform-bed-angle-1.jpeg.jpeg",
                "bedroom/sage-wood-platform-bed-angle-2.jpeg.jpeg",
                "bedroom/sage-wood-platform-bed-main.jpeg.jpeg"
            ]
        },
        {
            id: 5,
            title: "Linen Upholstered King Bed",
            category: "bedroom",
            label: "Bedroom",
            materialType: "linen",
            materialLabel: "Linen Fabric",
            material: "Premium Linen, Wood Frame",
            price: 0.01,
            oldPrice: 0.02,
            discount: "9% off",
            rating: 4.6,
            popularity: 78,
            isNewest: false,
            stock: "in-stock",
            stockVal: 10,
            status: "Active",
            availability: "In Stock",
            color: "Cream White",
            images: [
                "bedroom/linen-upholstered-king-bed.png",
                "bedroom/sage-wood-platform-bed-angle-1.jpeg.jpeg",
                "bedroom/sage-wood-platform-bed-angle-2.jpeg.jpeg",
                "bedroom/linen-upholstered-king-bed.png"
            ]
        },
        {
            id: 6,
            title: "Ivory Cloud Sofa Set",
            category: "living-room",
            label: "Living Room",
            materialType: "linen",
            materialLabel: "Linen Fabric",
            material: "Premium Boucle Fabric, Solid Wood",
            price: 0.01,
            oldPrice: 0.02,
            discount: "10% off",
            rating: 4.7,
            popularity: 92,
            isNewest: true,
            stock: "in-stock",
            stockVal: 15,
            status: "Active",
            availability: "In Stock",
            color: "Ivory White",
            images: [
                "living-room/ivory-cloud-sofa-set-main.jpeg.jpeg",
                "living-room/ivory-cloud-sofa-set-angle-1.jpeg.jpeg",
                "living-room/ivory-cloud-sofa-set-angle-2.jpeg.jpeg",
                "living-room/ivory-cloud-sofa-set-main.jpeg.jpeg"
            ]
        },
        {
            id: 7,
            title: "Ivory Luxe Living Room Set",
            category: "living-room",
            label: "Living Room",
            materialType: "velvet",
            materialLabel: "Velvet",
            material: "Leather upholstery, metal frame",
            price: 0.01,
            oldPrice: 0.02,
            discount: "9% off",
            rating: 4.9,
            popularity: 95,
            isNewest: true,
            stock: "in-stock",
            stockVal: 7,
            status: "Active",
            availability: "In Stock",
            color: "Ivory & Gold",
            images: [
                "living-room/ivory-luxe-living-room-set-main.jpeg.jpeg",
                "living-room/ivory-luxe-living-room-set-angle-1.jpeg.jpeg",
                "living-room/ivory-luxe-living-room-set-angle-2.jpeg.jpeg",
                "living-room/ivory-luxe-living-room-set-angle-3.jpeg.jpeg"
            ]
        },
        {
            id: 8,
            title: "Walnut Frame Sofa Set",
            category: "living-room",
            label: "Living Room",
            materialType: "linen",
            materialLabel: "Linen Fabric",
            material: "Solid Walnut Wood Rim, Textured Linen",
            price: 0.01,
            oldPrice: null,
            discount: "",
            rating: 4.1,
            popularity: 78,
            isNewest: false,
            stock: "in-stock",
            stockVal: 12,
            status: "Active",
            availability: "In Stock",
            color: "Walnut Brown & Gray",
            images: [
                "living-room/walnut-frame-sofa-set-main.jpeg.jpeg",
                "living-room/walnut-frame-sofa-set-angle-1.jpeg.jpeg",
                "living-room/walnut-frame-sofa-set-angle-2.jpeg.jpeg",
                "living-room/walnut-frame-sofa-set-angle-3.jpeg.jpeg"
            ]
        },
        {
            id: 9,
            title: "Emerald Luxe Dining Set",
            category: "dining-room",
            label: "Dining Room",
            materialType: "marble",
            materialLabel: "Marble",
            material: "Velvet Upholstery, Marble Top Table",
            price: 0.01,
            oldPrice: 0.02,
            discount: "11% off",
            rating: 4.9,
            popularity: 89,
            isNewest: false,
            stock: "in-stock",
            stockVal: 6,
            status: "Active",
            availability: "In Stock",
            color: "Emerald Green & Gold",
            images: [
                "dining-room/emerald-luxe-dining-set-main.jpeg.jpeg",
                "dining-room/emerald-luxe-dining-set-angle-1.jpeg.jpeg",
                "dining-room/emerald-luxe-dining-set-angle-2.jpeg.jpeg",
                "dining-room/emerald-luxe-dining-set-angle-3.jpeg.jpeg"
            ]
        },
        {
            id: 10,
            title: "Walnut Sage Dining Set",
            category: "dining-room",
            label: "Dining Room",
            materialType: "wood",
            materialLabel: "Wood",
            material: "Natural Oak Top, Eco-Leather Chairs",
            price: 0.01,
            oldPrice: 0.02,
            discount: "10% off",
            rating: 5.0,
            popularity: 94,
            isNewest: true,
            stock: "in-stock",
            stockVal: 11,
            status: "Active",
            availability: "In Stock",
            color: "Sage Green & Walnut Wood",
            images: [
                "dining-room/walnut-sage-dining-set-main.jpeg.jpeg",
                "dining-room/walnut-sage-dining-set-angle-1.jpeg.jpeg",
                "dining-room/walnut-sage-dining-set-angle-2.jpeg.jpeg",
                "dining-room/walnut-sage-dining-set-angle-3.jpeg.jpeg"
            ]
        }
    ];

    // Automatically normalize all product prices in localStorage to cents (0.01) on load
    let savedProds = null;
    try {
        savedProds = JSON.parse(localStorage.getItem('products'));
    } catch (e) {}
    if (!savedProds || !Array.isArray(savedProds)) {
        localStorage.setItem('products', JSON.stringify(defaultProducts));
    } else {
        savedProds.forEach(p => {
            if (p) {
                p.price = 0.01;
                if (p.oldPrice) {
                    p.oldPrice = 0.02;
                }
            }
        });
        localStorage.setItem('products', JSON.stringify(savedProds));
    }

    // Get current products
    function getProductsList() {
        return JSON.parse(localStorage.getItem('products')) || defaultProducts;
    }

    // Get wishlist storage
    function getWishlist() {
        return JSON.parse(localStorage.getItem('wishlistStateStorage')) || {};
    }

    // Save wishlist storage
    function saveWishlist(wishlist) {
        localStorage.setItem('wishlistStateStorage', JSON.stringify(wishlist));
        updateWishlistCountBadge();
        // If the page has updateWishlistButton (e.g. details modal on product page), sync it
        if (typeof updateWishlistButton === 'function') {
            updateWishlistButton();
        }
    }

    // Inject Wishlist Modal HTML dynamically into the body
    function injectWishlistModalHTML() {
        if (document.getElementById('wishlistModal')) return;

        const modalHTML = `
        <div class="modal fade" id="wishlistModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title"><i class="fa-regular fa-heart me-2"></i>Your Wishlist</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" id="wishlistModalBody">
                        <!-- Items will be injected here -->
                    </div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Render items inside the wishlist modal
    function renderWishlistItems() {
        const modalBody = document.getElementById('wishlistModalBody');
        if (!modalBody) return;

        const wishlist = getWishlist();
        const productsList = getProductsList();

        // Get wishlist product objects
        const wishlistedItems = productsList.filter(p => wishlist[p.title] && p.status !== "Inactive");

        if (wishlistedItems.length === 0) {
            modalBody.innerHTML = `
            <div class="wishlist-empty-state">
                <div class="wishlist-empty-icon"><i class="fa-regular fa-heart"></i></div>
                <div class="wishlist-empty-text">Your Wishlist is Empty</div>
                <div class="wishlist-empty-sub">Add items you love to see them here.</div>
                <a href="/products" class="wishlist-btn-shop" data-bs-dismiss="modal">
                    <i class="fa-solid fa-bag-shopping"></i> Browse Shop
                </a>
            </div>`;
            return;
        }

        let html = '';
        wishlistedItems.forEach(product => {
            const isOutOfStock = product.stock === "out-of-stock";
            const oldPriceHTML = product.discount && product.oldPrice ? 
                `<span class="line-through text-bs-muted ms-2" style="font-size: 0.8rem;">$${Number(product.oldPrice).toFixed(2)}</span>` : '';
            
            html += `
            <div class="wishlist-item-row" data-id="${product.id}">
                <img src="${product.images[0]}" alt="${product.title}" class="wishlist-item-img">
                <div class="wishlist-item-details">
                    <h4 class="wishlist-item-name" title="${product.title}">${product.title}</h4>
                    <div class="wishlist-item-category">${product.label || product.category} / ${product.materialLabel || product.materialType}</div>
                    <div class="wishlist-item-price">
                        $${Number(product.price).toFixed(2)}
                        ${oldPriceHTML}
                    </div>
                </div>
                <div class="wishlist-item-actions">
                    <button class="wishlist-btn-add-cart" ${isOutOfStock ? 'disabled' : ''}>
                        <i class="fa-solid fa-cart-shopping"></i> ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                    <button class="wishlist-btn-remove" title="Remove">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>`;
        });

        modalBody.innerHTML = html;

        // Bind events to rendered items
        const rows = modalBody.querySelectorAll('.wishlist-item-row');
        rows.forEach(row => {
            const productId = parseInt(row.getAttribute('data-id'));
            const product = productsList.find(p => p.id === productId);

            // Card click (normally) -> Opens product details modal
            row.addEventListener('click', function (e) {
                // Ensure we didn't click inside wishlist-item-actions
                if (e.target.closest('.wishlist-item-actions')) return;
                openProductDetails(product);
            });

            // Add to Cart click
            const addCartBtn = row.querySelector('.wishlist-btn-add-cart');
            if (addCartBtn) {
                addCartBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    addToCartFromWishlist(product);
                });
            }

            // Remove click
            const removeBtn = row.querySelector('.wishlist-btn-remove');
            if (removeBtn) {
                removeBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    removeFromWishlist(product);
                });
            }
        });
    }

    // Add to Cart logic
    function addToCartFromWishlist(product) {
        if (product.stock === "out-of-stock") {
            triggerToast("This product is currently out of stock!", "danger");
            return;
        }

        let cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
        const existingItem = cartItems.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cartItems.push({
                id: product.id,
                title: product.title,
                category: (product.label || product.category) + " / " + (product.materialLabel || product.materialType),
                price: product.price,
                quantity: 1,
                image: product.images[0]
            });
        }

        localStorage.setItem("cartItems", JSON.stringify(cartItems));

        // Update cart badge across navbar
        updateCartCountBadge();

        // Remove from wishlist
        const wishlist = getWishlist();
        delete wishlist[product.title];
        saveWishlist(wishlist);

        // Re-render wishlist items smoothly in-place
        renderWishlistItems();

        // Show Toast
        triggerToast("1 item added to cart & removed from wishlist!", "success");
    }

    // Remove from Wishlist logic
    function removeFromWishlist(product) {
        const wishlist = getWishlist();
        delete wishlist[product.title];
        saveWishlist(wishlist);
        
        // Re-render modal items
        renderWishlistItems();
        
        triggerToast("Product removed from wishlist!", "success");
    }

    // Open Product Details Modal
    function openProductDetails(product) {
        // Close wishlist modal
        const wishlistModalEl = document.getElementById('wishlistModal');
        if (wishlistModalEl) {
            const modalInstance = bootstrap.Modal.getInstance(wishlistModalEl);
            if (modalInstance) {
                modalInstance.hide();
            }
        }

        // Check if index.html/products.html details modal function is active
        if (typeof openProductModalByIndex === 'function') {
            const productsList = getProductsList();
            const idx = productsList.findIndex(p => p.title === product.title);
            if (idx !== -1) {
                setTimeout(() => {
                    openProductModalByIndex(idx);
                }, 350);
            }
        } else if (typeof openProductModal === 'function') {
            // categories.html style details modal
            setTimeout(() => {
                openProductModal(
                    product.title, 
                    product.price, 
                    product.rating, 
                    `${product.rating} rating`, 
                    product.images[0], 
                    product.images[1], 
                    product.images[2], 
                    product.images[3]
                );
            }, 350);
        } else {
            if (typeof window.__reactNavigate === 'function') {
                window.__reactNavigate(`/products?productId=${product.id}`);
            } else {
                window.location.href = `products.html?productId=${product.id}`;
            }
        }
    }

    // Helper to trigger Toast Notification
    function triggerToast(message, type = 'success') {
        if (typeof showToast === 'function') {
            showToast(message);
        } else if (typeof showTopFloatNotification === 'function') {
            showTopFloatNotification(message, type);
        } else {
            // Fallback dynamically created toast
            const toast = document.createElement('div');
            toast.className = 'sitopia-toast show-toast';
            toast.style.position = 'fixed';
            toast.style.bottom = '28px';
            toast.style.right = '28px';
            toast.style.zIndex = '9999';
            toast.innerHTML = `<i class="fa-solid fa-${type === 'success' ? 'circle-check' : 'circle-xmark'} me-2"></i><span>${message}</span>`;
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.classList.remove('show-toast');
                setTimeout(() => toast.remove(), 500);
            }, 2600);
        }
    }

    // Update wishlist badge in navbar
    function updateWishlistCountBadge() {
        const wishlist = getWishlist();
        const count = Object.keys(wishlist).length;

        // Select all wishlist links on page
        const wishlistLinks = document.querySelectorAll('a[title="Wishlist"]');
        wishlistLinks.forEach(link => {
            let badge = link.querySelector('.wishlist-count');
            if (count > 0) {
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'wishlist-count';
                    link.appendChild(badge);
                }
                badge.innerText = count;
            } else {
                if (badge) {
                    badge.remove();
                }
            }
        });
    }

    // Helper to update cart badge in navbar
    function updateCartCountBadge() {
        const cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
        const totalQty = cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
        
        // Try page local function first
        if (typeof updateCartCount === 'function') {
            updateCartCount();
        } else {
            const cartCountEl = document.getElementById("cartCount");
            if (cartCountEl) {
                cartCountEl.innerText = totalQty;
            }
        }
    }

    // Initialize navbar triggers
    function initWishlistTriggers() {
        injectWishlistModalHTML();
        updateWishlistCountBadge();

        const wishlistLinks = document.querySelectorAll('a[title="Wishlist"]');
        wishlistLinks.forEach(link => {
            // Prevent default href="#" action and open modal instead
            link.addEventListener('click', function (e) {
                e.preventDefault();
                renderWishlistItems();
                const wishlistModalEl = document.getElementById('wishlistModal');
                if (wishlistModalEl) {
                    const modal = bootstrap.Modal.getOrCreateInstance(wishlistModalEl);
                    modal.show();
                }
            });
        });
    }

    // Run on DOM load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWishlistTriggers);
    } else {
        initWishlistTriggers();
    }
})();
