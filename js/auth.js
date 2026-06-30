/* ======= AUTHENTICATION AND DATA SYNC SYSTEM ======= */

// Inject styles for profile dropdown, toasts, and forgot password modal
(function() {
    const style = document.createElement('style');
    style.innerHTML = `
        /* Profile Dropdown Menu Styling */
        .profile-dropdown-container {
            position: relative;
            display: inline-block;
        }
        .profile-dropdown-menu {
            position: absolute;
            top: calc(100% + 10px);
            right: 0;
            z-index: 1050;
            display: none;
            min-width: 240px;
            padding: 16px;
            margin: 0;
            font-size: 0.9rem;
            color: #111111;
            text-align: left;
            list-style: none;
            background-color: #FAF9F6;
            background-clip: padding-box;
            border: 1px solid rgba(7, 61, 53, 0.08);
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(7, 61, 53, 0.15);
            transform: translateY(10px);
            opacity: 0;
            transition: transform 0.2s ease, opacity 0.2s ease;
        }
        .profile-dropdown-menu.show {
            display: block;
            transform: translateY(0);
            opacity: 1;
        }
        .dropdown-header-info {
            padding: 4px 8px 10px;
        }
        .user-display-name {
            display: block;
            font-family: 'Cormorant Garamond', serif;
            font-size: 1.25rem;
            font-weight: 700;
            color: #073D35;
            line-height: 1.2;
        }
        .user-display-email {
            display: block;
            font-size: 0.78rem;
            color: #7A8585;
            font-weight: 500;
            margin-top: 2px;
        }
        .profile-dropdown-menu .dropdown-divider {
            height: 1px;
            margin: 8px 0;
            overflow: hidden;
            background-color: rgba(7, 61, 53, 0.08);
            border: 0;
        }
        .profile-dropdown-menu .dropdown-item {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            padding: 8px 12px;
            clear: both;
            font-weight: 600;
            color: #073D35;
            text-align: inherit;
            text-decoration: none;
            white-space: nowrap;
            background-color: transparent;
            border: 0;
            border-radius: 8px;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        .profile-dropdown-menu .dropdown-item i {
            font-size: 0.95rem;
            color: #D8A128;
            width: 16px;
            text-align: center;
        }
        .profile-dropdown-menu .dropdown-item:hover {
            background-color: rgba(7, 61, 53, 0.05);
            color: #073D35;
            transform: translateX(3px);
        }
        .profile-dropdown-menu .dropdown-item.logout-btn {
            color: #B42318;
        }
        .profile-dropdown-menu .dropdown-item.logout-btn i {
            color: #B42318;
        }
        .profile-dropdown-menu .dropdown-item.logout-btn:hover {
            background-color: rgba(180, 35, 24, 0.05);
        }
        
        /* Toast Notifications Styling - Top Center, Beautiful Rounded Rect */
        .sitopia-toast, .toast-box {
            position: fixed !important;
            top: 24px !important;
            bottom: auto !important;
            left: 50% !important;
            right: auto !important;
            transform: translate(-50%, -40px) !important;
            background: rgba(7, 61, 53, 0.96) !important;
            backdrop-filter: blur(8px) !important;
            -webkit-backdrop-filter: blur(8px) !important;
            border: 1.5px solid rgba(216, 161, 40, 0.35) !important;
            color: #ffffff !important;
            padding: 12px 24px !important;
            border-radius: 14px !important;
            box-shadow: 0 15px 35px rgba(7, 61, 53, 0.35) !important;
            font-family: 'Manrope', sans-serif !important;
            font-weight: 700 !important;
            font-size: 0.92rem !important;
            z-index: 99999 !important;
            display: flex !important;
            align-items: center !important;
            gap: 12px !important;
            opacity: 0 !important;
            visibility: hidden !important;
            transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease, visibility 0.4s ease !important;
            pointer-events: none !important;
        }
        
        .sitopia-toast.show, .toast-box.show, 
        .sitopia-toast.show-toast, .toast-box.show-toast {
            transform: translate(-50%, 0) !important;
            opacity: 1 !important;
            visibility: visible !important;
        }

        .sitopia-toast i, .toast-box i {
            color: #D8A128 !important;
            font-size: 1.15rem !important;
        }

        /* Forgot Password Wizard Steps */
        .fp-step {
            display: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .fp-step.active {
            display: block;
            opacity: 1;
        }
        .fp-progress-dots {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-bottom: 24px;
        }
        .fp-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: rgba(7, 61, 53, 0.15);
            transition: all 0.3s ease;
        }
        .fp-dot.active {
            background-color: #D8A128;
            width: 24px;
            border-radius: 4px;
        }
        .fp-message {
            background-color: rgba(216, 161, 40, 0.08);
            border: 1px dashed rgba(216, 161, 40, 0.4);
            padding: 12px;
            border-radius: 8px;
            font-size: 0.82rem;
            color: #073D35;
            margin-bottom: 16px;
            line-height: 1.4;
            font-weight: 500;
        }
        .fp-button-group {
            display: grid;
            grid-template-columns: 1fr 1.5fr;
            gap: 12px;
            margin-top: 15px;
        }
    `;
    document.head.appendChild(style);
})();

// ==================== DATA INITIALIZATION ====================

const defaultProducts = [
    {
        id: 1,
        title: "Bloom Accent Chair Set",
        category: "chair",
        label: "Chair",
        materialType: "linen",
        materialLabel: "Linen Fabric",
        material: "Premium Oak Frame, Linen Fabric",
        price: 150,
        oldPrice: 170,
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
        price: 190,
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
        price: 850,
        oldPrice: 950,
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
        price: 340,
        oldPrice: 400,
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
        price: 820,
        oldPrice: 900,
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
        price: 760,
        oldPrice: 850,
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
        price: 1450,
        oldPrice: 1600,
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
        price: 1100,
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
        price: 1600,
        oldPrice: 1800,
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
        price: 1250,
        oldPrice: 1390,
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
const defaultOrders = [
    {
        id: "#MF-250522-001",
        phone: "0612345678",
        customer: "Abdi Hassan",
        amount: "$350.00",
        payment: "Paid",
        paymentType: "paid",
        address: "Hodan, Mogadishu",
        driver: "Ahmed Ali - 0619988776",
        estimate: "Delivered successfully",
        currentStep: 5,
        product: "Bloom Accent Chair Set Set",
        date: "May 22, 2026"
    },
    {
        id: "#MF-250522-002",
        phone: "0611112222",
        customer: "Hodan Ali",
        amount: "$350.00",
        payment: "Pending",
        paymentType: "pending",
        address: "Wadajir, Mogadishu",
        driver: "Not assigned yet",
        estimate: "Waiting for payment verification",
        currentStep: 1,
        product: "Bloom Accent Chair Set Set",
        date: "May 22, 2026"
    },
    {
        id: "#MF-250522-003",
        phone: "0613334444",
        customer: "Omar Mohamed",
        amount: "$180.00",
        payment: "Paid",
        paymentType: "paid",
        address: "Karaan, Mogadishu",
        driver: "Hassan Omar - 0614455667",
        estimate: "Out for delivery via driver",
        currentStep: 4,
        product: "Olive Curve Lounge Chair",
        date: "May 21, 2026"
    },
    {
        id: "#MF-250522-004",
        phone: "0614445555",
        customer: "Ayan Abdullahi",
        amount: "$530.00",
        payment: "Pending",
        paymentType: "pending",
        address: "Hamarweyne, Mogadishu",
        driver: "Not assigned yet",
        estimate: "Waiting for payment verification",
        currentStep: 1,
        product: "Blush Velvet Arch Bed",
        date: "May 21, 2026"
    },
    {
        id: "#MF-250522-005",
        phone: "0615556666",
        customer: "Mohamed Yusuf",
        amount: "$760.00",
        payment: "Paid",
        paymentType: "paid",
        address: "Wadajir, Mogadishu",
        driver: "Ahmed Ali - 0619988776",
        estimate: "Delivered successfully",
        currentStep: 5,
        product: "Ivory Cloud Sofa Set",
        date: "May 20, 2026"
    },
    {
        id: "#MF-250522-006",
        phone: "0616667777",
        customer: "Mustafa Omar",
        amount: "$340.00",
        payment: "Failed",
        paymentType: "failed",
        address: "Hodan, Mogadishu",
        driver: "Not assigned",
        estimate: "Order Cancelled",
        currentStep: 0,
        product: "Sage Wood Platform Bed",
        date: "May 20, 2026"
    },
    {
        id: "#MF-250522-007",
        phone: "0617778888",
        customer: "Fadumo Hassan",
        amount: "$230.00",
        payment: "Paid",
        paymentType: "paid",
        address: "Karaan, Mogadishu",
        driver: "Hassan Omar - 0614455667",
        estimate: "Preparing order",
        currentStep: 3,
        product: "Bloom Accent Chair Set Set",
        date: "May 19, 2026"
    },
    {
        id: "#MF-250522-008",
        phone: "0618889999",
        customer: "Ali Warsame",
        amount: "$150.00",
        payment: "Paid",
        paymentType: "paid",
        address: "Hodan, Mogadishu",
        driver: "Ahmed Ali - 0619988776",
        estimate: "Delivered successfully",
        currentStep: 5,
        product: "Bloom Accent Chair Set Set",
        date: "May 18, 2026"
    },
    {
        id: "#MF-250522-009",
        phone: "0619990000",
        customer: "Halima Sadia",
        amount: "$850.00",
        payment: "Pending",
        paymentType: "pending",
        address: "Wadajir, Mogadishu",
        driver: "Not assigned yet",
        estimate: "Waiting for payment verification",
        currentStep: 1,
        product: "Blush Velvet Arch Bed",
        date: "May 18, 2026"
    },
    {
        id: "#MF-250522-010",
        phone: "0611239876",
        customer: "Farhan Barre",
        amount: "$1,600.00",
        payment: "Paid",
        paymentType: "paid",
        address: "Karaan, Mogadishu",
        driver: "Hassan Omar - 0614455667",
        estimate: "Delivered successfully",
        currentStep: 5,
        product: "Emerald Luxe Dining Set",
        date: "May 17, 2026"
    },
    {
        id: "#MF-250522-011",
        phone: "0615432109",
        customer: "Sahra Ilmi",
        amount: "$980.00",
        payment: "Paid",
        paymentType: "paid",
        address: "Hodan, Mogadishu",
        driver: "Ahmed Ali - 0619988776",
        estimate: "Delivered successfully",
        currentStep: 5,
        product: "Ivory Cloud Sofa Set",
        date: "May 17, 2026"
    },
    {
        id: "#MF-250522-012",
        phone: "0618765432",
        customer: "Warsame Duale",
        amount: "$1,450.00",
        payment: "Pending",
        paymentType: "pending",
        address: "Wadajir, Mogadishu",
        driver: "Not assigned yet",
        estimate: "Waiting for payment verification",
        currentStep: 1,
        product: "Sunhaven Patio Lounge Set",
        date: "May 16, 2026"
    }
];

const defaultUsers = [
    {
        id: "USR-001",
        firstName: "Abdirahman",
        lastName: "",
        email: "admin@gmail.com",
        phone: "+252615000000",
        address: "Mogadishu, Somalia",
        password: "admin123",
        avatar: "https://ui-avatars.com/api/?name=Abdirahman&background=073D35&color=ffffff&bold=true&size=128"
    },
    {
        id: "USR-1001",
        firstName: "Abdifatah",
        lastName: "Hassan",
        email: "abdifatah@gmail.com",
        phone: "0612345678",
        address: "Hodan, Mogadishu",
        password: "customer123",
        avatar: ""
    },
    {
        id: "USR-1002",
        firstName: "Mohamed",
        lastName: "Nur",
        email: "mohamed@gmail.com",
        phone: "0611112222",
        address: "Wadajir, Mogadishu",
        password: "customer123",
        avatar: ""
    },
    {
        id: "USR-1003",
        firstName: "Amina",
        lastName: "Yusuf",
        email: "amina@gmail.com",
        phone: "0613334444",
        address: "Karaan, Mogadishu",
        password: "customer123",
        avatar: ""
    }
];

function initializeLocalStorage() {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
    
    let localProducts = [];
    try {
        localProducts = JSON.parse(localStorage.getItem('products')) || [];
    } catch (e) {}
    
    const hasAll10 = localProducts.length === 10 && localProducts.some(p => p.title === "Bloom Accent Chair Set");
    
    if (!localStorage.getItem('products') || !hasAll10) {
        const prodsToSave = defaultProducts.map(p => {
            p.price = 0.01;
            if (p.oldPrice) {
                p.oldPrice = 0.02;
            }
            return p;
        });
        localStorage.setItem('products', JSON.stringify(prodsToSave));
    }
    if (!localStorage.getItem('orders')) {
        localStorage.setItem('orders', JSON.stringify(defaultOrders));
    }
}

// Initialize immediately at script load
initializeLocalStorage();

// ==================== ALERTS & NOTIFICATIONS ====================

function showAlert(containerId, message, type = 'danger') {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert" style="border-radius: 10px; font-size: 0.88rem; font-weight: 600;">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
    }
}

function showModalError(stepId, message) {
    const stepEl = document.getElementById(stepId);
    if (stepEl) {
        const existingAlert = stepEl.querySelector('.alert-modal-error');
        if (existingAlert) existingAlert.remove();
        
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-modal-error mt-2';
        alertDiv.style.borderRadius = '8px';
        alertDiv.style.fontSize = '0.82rem';
        alertDiv.style.fontWeight = '600';
        alertDiv.innerHTML = `<i class="fa-solid fa-circle-exclamation me-2"></i>${message}`;
        
        const button = stepEl.querySelector('button');
        if (button) {
            stepEl.insertBefore(alertDiv, button);
        } else {
            stepEl.appendChild(alertDiv);
        }
        
        setTimeout(() => {
            alertDiv.remove();
        }, 4000);
    }
}

function showTopFloatNotification(message, type = 'success') {
    let toast = document.getElementById('sitopiaToast') || document.getElementById('toastBox') || document.getElementById('dynamicToast');
    let msgEl = document.getElementById('toastMessage');
    
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'dynamicToast';
        toast.className = 'sitopia-toast';
        
        const icon = document.createElement('i');
        icon.className = type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-triangle-exclamation';
        toast.appendChild(icon);
        
        msgEl = document.createElement('span');
        msgEl.id = 'toastMessage';
        toast.appendChild(msgEl);
        
        document.body.appendChild(toast);
    } else {
        const icon = toast.querySelector('i');
        if (icon) {
            if (type === 'success') {
                icon.className = 'fa-solid fa-circle-check';
            } else if (type === 'danger') {
                icon.className = 'fa-solid fa-circle-xmark';
            } else {
                icon.className = 'fa-solid fa-triangle-exclamation';
            }
        }
    }
    
    if (msgEl) {
        msgEl.textContent = message;
    } else {
        const span = toast.querySelector('span');
        if (span) span.textContent = message;
    }
    
    toast.classList.add('show');
    
    if (toast.timeoutId) {
        clearTimeout(toast.timeoutId);
    }
    
    toast.timeoutId = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ==================== PHONE NUMBER NORMALIZATION ====================

function normalizePhoneNumber(phone) {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('252')) {
        cleaned = cleaned.substring(3);
    }
    if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }
    return cleaned;
}

// ==================== PASSWORD VISIBILITY TOGGLE ====================

function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        const wrapper = input.parentElement;
        const icon = wrapper.querySelector('.password-toggle-icon') || input.nextElementSibling;
        if (input.type === 'password') {
            input.type = 'text';
            if (icon) {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        } else {
            input.type = 'password';
            if (icon) {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            }
        }
    }
}

// ==================== LOGIN FORM HANDLER ====================

// ==================== LOGIN FORM HANDLER ====================

async function handleLoginSubmit(e) {
    e.preventDefault();
    const form = e.target;
    
    let alertContainerId = 'alertContainer';
    if (document.getElementById('loginAlertContainer')) {
        alertContainerId = 'loginAlertContainer';
    }
    
    const emailInput = form.querySelector('#loginEmail');
    const passwordInput = form.querySelector('#loginPassword');
    
    if (!emailInput || !passwordInput) return;
    
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    
    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Success
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('token', data.token); // Store JWT token
            localStorage.setItem('userEmail', data.user.email);
            localStorage.setItem('userFullName', data.user.firstName + ' ' + (data.user.lastName || ''));
            localStorage.setItem('userPhone', data.user.phone || '');
            localStorage.setItem('userAvatar', data.user.avatar || '');
            localStorage.setItem('userAddress', data.user.address || '');
            localStorage.setItem('userRole', data.user.role || 'user');
            
            showAlert(alertContainerId, '✅ Login successful! Redirecting...', 'success');
            
            emailInput.classList.remove('is-invalid');
            passwordInput.classList.remove('is-invalid');
            
            setTimeout(() => {
                const modalEl = document.getElementById('loginModal');
                if (modalEl) {
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if (modal) modal.hide();
                }
                
                if (data.user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    if (window.location.pathname.includes('login.html')) {
                        window.location.href = 'index.html';
                    } else {
                        window.location.reload();
                    }
                }
            }, 1200);
        } else {
            showAlert(alertContainerId, `❌ ${data.message}`, 'danger');
            passwordInput.value = '';
            passwordInput.focus();
            emailInput.classList.add('is-invalid');
            passwordInput.classList.add('is-invalid');
        }
    } catch (err) {
        console.error(err);
        showAlert(alertContainerId, '❌ Connection to backend failed! Please try again.', 'danger');
    }
}

// ==================== REGISTER FORM HANDLER ====================

async function handleRegisterSubmit(e) {
    e.preventDefault();
    const form = e.target;
    
    let alertContainerId = 'alertContainer';
    const firstNameInput = form.querySelector('#regFirstName');
    const lastNameInput = form.querySelector('#regLastName');
    const emailInput = form.querySelector('#regEmail');
    const countryCodeInput = form.querySelector('#regCountryCode');
    const phoneInput = form.querySelector('#regPhone');
    const passwordInput = form.querySelector('#regPassword');
    const confirmPasswordInput = form.querySelector('#regConfirmPassword');
    const termsCheck = form.querySelector('#termsCheck');
    
    if (!firstNameInput || !lastNameInput || !emailInput || !phoneInput || !passwordInput || !confirmPasswordInput) return;
    
    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const countryCode = countryCodeInput ? countryCodeInput.value : '';
    const phone = countryCode + phoneInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (password.length < 8) {
        showAlert(alertContainerId, '❌ Password must be at least 8 characters long!', 'danger');
        passwordInput.focus();
        return;
    }
    
    if (password !== confirmPassword) {
        showAlert(alertContainerId, '❌ Passwords do not match!', 'danger');
        confirmPasswordInput.focus();
        return;
    }
    
    if (termsCheck && !termsCheck.checked) {
        showAlert(alertContainerId, '❌ You must agree to the Terms & Conditions!', 'danger');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName, lastName, email, phone, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert(alertContainerId, '✅ Registration successful! Please login to enter the website.', 'success');
            
            setTimeout(() => {
                const regModalEl = document.getElementById('registerModal');
                const loginModalEl = document.getElementById('loginModal');
                if (regModalEl && loginModalEl) {
                    bootstrap.Modal.getInstance(regModalEl).hide();
                    regModalEl.addEventListener('hidden.bs.modal', function onHide() {
                        bootstrap.Modal.getOrCreateInstance(loginModalEl).show();
                        regModalEl.removeEventListener('hidden.bs.modal', onHide);
                    }, { once: true });
                } else {
                    window.location.href = 'login.html';
                }
            }, 2000);
        } else {
            showAlert(alertContainerId, `❌ ${data.message}`, 'danger');
        }
    } catch (err) {
        console.error(err);
        showAlert(alertContainerId, '❌ Connection to backend failed! Please try again.', 'danger');
    }
}

// ==================== FORGOT PASSWORD WIZARD ====================

let fpState = {
    email: '',
    code: ''
};

function initForgotPassword() {
    fpState = { email: '', code: '' };
    
    const phoneInput = document.getElementById('fpPhone');
    const codeInput = document.getElementById('fpCode');
    const newPassInput = document.getElementById('fpNewPassword');
    const confirmPassInput = document.getElementById('fpConfirmPassword');
    
    if (phoneInput) phoneInput.value = '';
    if (codeInput) codeInput.value = '';
    if (newPassInput) newPassInput.value = '';
    if (confirmPassInput) confirmPassInput.value = '';
    
    const step1 = document.getElementById('fpStep1');
    const step2 = document.getElementById('fpStep2');
    const step3 = document.getElementById('fpStep3');
    
    if (step1) step1.classList.add('active');
    if (step2) step2.classList.remove('active');
    if (step3) step3.classList.remove('active');
    
    updateFpDots(0);
}

function updateFpDots(activeIndex) {
    const dots = document.querySelectorAll('.fp-progress-dots .fp-dot');
    dots.forEach((dot, idx) => {
        if (idx === activeIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

async function fpNextFromStep1() {
    const phoneInput = document.getElementById('fpPhone');
    if (!phoneInput) return;
    
    const phoneVal = phoneInput.value.trim();
    if (!phoneVal) {
        showModalError('fpStep1', 'Please enter your phone number!');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:5000/api/auth/verify-phone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phoneVal })
        });
        
        const data = await response.json();
        if (data.success) {
            fpState.email = data.email;
            fpState.code = data.code; // '123456'
            
            const codeMessage = document.getElementById('fpCodeMessage');
            if (codeMessage) {
                codeMessage.innerHTML = `Verify your phone number. We sent a code (+252 XXXXXXX).<br><strong>The test code is: 123456</strong>`;
            }
            
            document.getElementById('fpStep1').classList.remove('active');
            document.getElementById('fpStep2').classList.add('active');
            updateFpDots(1);
        } else {
            showModalError('fpStep1', `❌ ${data.message}`);
        }
    } catch (err) {
        console.error(err);
        showModalError('fpStep1', '❌ Connection to server failed!');
    }
}

function fpNextFromStep2() {
    const codeInput = document.getElementById('fpCode');
    if (!codeInput) return;
    
    const codeVal = codeInput.value.trim();
    if (codeVal === fpState.code || codeVal === '123456') {
        document.getElementById('fpStep2').classList.remove('active');
        document.getElementById('fpStep3').classList.add('active');
        updateFpDots(2);
    } else {
        showModalError('fpStep2', '❌ The code you entered is incorrect!');
    }
}

function fpGoBack(currentStep) {
    if (currentStep === 2) {
        document.getElementById('fpStep2').classList.remove('active');
        document.getElementById('fpStep1').classList.add('active');
        updateFpDots(0);
    } else if (currentStep === 3) {
        document.getElementById('fpStep3').classList.remove('active');
        document.getElementById('fpStep2').classList.add('active');
        updateFpDots(1);
    }
}

async function fpSubmitNewPassword() {
    const newPassInput = document.getElementById('fpNewPassword');
    const confirmPassInput = document.getElementById('fpConfirmPassword');
    
    if (!newPassInput || !confirmPassInput) return;
    
    const newPass = newPassInput.value;
    const confirmPass = confirmPassInput.value;
    
    if (newPass.length < 8) {
        showModalError('fpStep3', '❌ Password must be at least 8 characters long!');
        return;
    }
    
    if (newPass !== confirmPass) {
        showModalError('fpStep3', '❌ Passwords do not match!');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:5000/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: fpState.email, newPassword: newPass })
        });
        
        const data = await response.json();
        if (data.success) {
            showTopFloatNotification('✅ Your password has been changed! You can log in now.');
            
            const fpModalEl = document.getElementById('forgotPasswordModal');
            if (fpModalEl) {
                const modal = bootstrap.Modal.getInstance(fpModalEl);
                if (modal) modal.hide();
            }
            
            showAlert('alertContainer', '✅ Your password has been changed! Please login.', 'success');
        } else {
            showModalError('fpStep3', `❌ ${data.message}`);
        }
    } catch (err) {
        console.error(err);
        showModalError('fpStep3', '❌ Connection to server failed!');
    }
}

// ==================== PROFILE PAGE INITIALIZATION & SUBMIT ====================

async function initProfilePage() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch('http://localhost:5000/api/auth/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
            const user = data.user;
            
            const nameInput = document.getElementById('profileNameInput');
            const emailInput = document.getElementById('profileEmailInput');
            const phoneInput = document.getElementById('profilePhoneInput');
            const addressInput = document.getElementById('profileAddressInput');
            
            if (nameInput) nameInput.value = user.firstName + ' ' + (user.lastName || '');
            if (emailInput) emailInput.value = user.email;
            if (phoneInput) phoneInput.value = user.phone;
            if (addressInput) addressInput.value = user.address || '';
            
            // Sync with localstorage just in case
            localStorage.setItem('userFullName', user.firstName + ' ' + (user.lastName || ''));
            localStorage.setItem('userPhone', user.phone);
            localStorage.setItem('userAvatar', user.avatar || '');
            localStorage.setItem('userAddress', user.address || '');
            
            // Set up avatar displays on profile page
            const img = document.getElementById('profilePageAvatar');
            const initials = document.getElementById('avatarInitials');
            const cardName = document.getElementById('profileCardName');
            
            if (cardName) cardName.textContent = user.firstName + ' ' + (user.lastName || '');
            
            if (user.avatar && img && initials) {
                img.src = user.avatar;
                img.style.display = 'block';
                initials.style.display = 'none';
            } else if (img && initials) {
                img.style.display = 'none';
                initials.style.display = 'flex';
                initials.textContent = user.firstName.charAt(0).toUpperCase();
            }
        }
    } catch (err) {
        console.error('Error fetching user profile:', err);
    }
}

async function handleProfileSubmit(e) {
    e.preventDefault();
    const fullName = document.getElementById('profileNameInput').value.trim();
    const phone = document.getElementById('profilePhoneInput').value.trim();
    const address = document.getElementById('profileAddressInput').value.trim();
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch('http://localhost:5000/api/auth/profile', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ fullName, phone, address })
        });
        
        const data = await response.json();
        if (data.success) {
            const user = data.user;
            localStorage.setItem('userFullName', user.firstName + ' ' + (user.lastName || ''));
            localStorage.setItem('userPhone', user.phone);
            localStorage.setItem('userAddress', user.address || '');
            
            showTopFloatNotification('✅ Profile updated successfully!');
            updateUserIcon();
            
            if (typeof updateNavPill === 'function') updateNavPill();
            if (typeof refreshProfileAvatar === 'function') refreshProfileAvatar();
        } else {
            showTopFloatNotification(`❌ ${data.message}`, 'danger');
        }
    } catch (err) {
        console.error(err);
        showTopFloatNotification('❌ Connection to server failed!', 'danger');
    }
}

async function handleChangePasswordSubmit(e) {
    e.preventDefault();
    const currentPassword = document.getElementById('currentPasswordInput').value;
    const newPassword = document.getElementById('newPasswordInput').value;
    const confirmPassword = document.getElementById('confirmPasswordInput').value;
    
    if (newPassword.length < 8) {
        showTopFloatNotification('❌ New password must be at least 8 characters long!', 'danger');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showTopFloatNotification('❌ New passwords do not match!', 'danger');
        return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch('http://localhost:5000/api/auth/change-password', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        
        const data = await response.json();
        if (data.success) {
            showTopFloatNotification('✅ Your password has been changed successfully!');
            e.target.reset();
        } else {
            showTopFloatNotification(`❌ ${data.message}`, 'danger');
        }
    } catch (err) {
        console.error(err);
        showTopFloatNotification('❌ Connection to server failed!', 'danger');
    }
}

// ==================== NAVBAR UI & USER ICON STATE ====================

function updateUserIcon() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userAccountBtn = document.getElementById('userAccountBtn');
    const userIcon = document.getElementById('userIcon');
    const profileLetter = document.getElementById('profileLetter');
    
    if (!userAccountBtn) return;
    
    if (isLoggedIn) {
        const fullName = localStorage.getItem('userFullName') || 'Customer';
        const avatar = localStorage.getItem('userAvatar') || '';
        
        if (userIcon) userIcon.style.display = 'none';
        if (profileLetter) {
            profileLetter.style.display = 'inline-flex';
            profileLetter.style.alignItems = 'center';
            profileLetter.style.justifyContent = 'center';
            
            if (avatar) {
                profileLetter.innerHTML = `<img src="${avatar}" alt="avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            } else {
                profileLetter.textContent = fullName.trim().charAt(0).toUpperCase();
                profileLetter.style.backgroundColor = 'var(--gold)';
                profileLetter.style.color = '#FFFFFF';
                profileLetter.style.fontWeight = '800';
            }
        }
        
        userAccountBtn.title = `Logged in as: ${fullName} (Click for profile menu)`;
    } else {
        if (userIcon) userIcon.style.display = 'inline-block';
        if (profileLetter) {
            profileLetter.style.display = 'none';
            profileLetter.innerHTML = '';
        }
        userAccountBtn.title = "User Account";
    }
}

function updateProfileDropdownContent() {
    const nameEl = document.getElementById('dropdownFullName');
    const emailEl = document.getElementById('dropdownEmail');
    
    const fullName = localStorage.getItem('userFullName') || 'Customer';
    const email = localStorage.getItem('userEmail') || '';
    
    if (nameEl) nameEl.textContent = fullName;
    if (emailEl) emailEl.textContent = email;
}

function setupProfileDropdown() {
    const userBtn = document.getElementById('userAccountBtn');
    if (!userBtn) return;
    
    // Check if dropdown elements already wrapped
    if (!userBtn.parentElement.classList.contains('profile-dropdown-container')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'profile-dropdown-container';
        
        userBtn.parentNode.insertBefore(wrapper, userBtn);
        wrapper.appendChild(userBtn);
        
        const dropdownHtml = `
            <div id="profileDropdownMenu" class="profile-dropdown-menu">
                <div class="dropdown-header-info">
                    <span class="user-display-name" id="dropdownFullName">Customer Name</span>
                    <span class="user-display-email" id="dropdownEmail">email@example.com</span>
                </div>
                <hr class="dropdown-divider">
                <a href="profile.html" class="dropdown-item"><i class="fa-regular fa-user"></i> My Profile</a>
                <a href="track-order.html" class="dropdown-item"><i class="fa-solid fa-location-dot"></i> Track Order</a>
                <hr class="dropdown-divider">
                <button id="logoutBtn" class="dropdown-item logout-btn"><i class="fa-solid fa-arrow-right-from-bracket"></i> Logout</button>
            </div>
        `;
        wrapper.insertAdjacentHTML('beforeend', dropdownHtml);
        
        // Add logout handler
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userFullName');
                localStorage.removeItem('userPhone');
                localStorage.removeItem('userAvatar');
                
                showTopFloatNotification('✅ Logout completed!');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            });
        }
    }
}

// ==================== EVENT DELEGATIONS ====================

document.addEventListener('submit', function(e) {
    if (e.target && e.target.id === 'loginForm') {
        handleLoginSubmit(e);
    }
    if (e.target && e.target.id === 'registerForm') {
        handleRegisterSubmit(e);
    }
    if (e.target && e.target.id === 'profileForm') {
        handleProfileSubmit(e);
    }
    if (e.target && e.target.id === 'changePasswordForm') {
        handleChangePasswordSubmit(e);
    }
});

document.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'profileImageInput') {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async function(evt) {
                const base64 = evt.target.result;
                
                const img = document.getElementById('profilePageAvatar');
                const initials = document.getElementById('avatarInitials');
                
                const token = localStorage.getItem('token');
                if (!token) return;
                
                try {
                    const response = await fetch('http://localhost:5000/api/auth/profile', {
                        method: 'PUT',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ avatar: base64 })
                    });
                    
                    const data = await response.json();
                    if (data.success) {
                        if (img && initials) {
                            img.src = base64;
                            img.style.display = 'block';
                            initials.style.display = 'none';
                        }
                        localStorage.setItem('userAvatar', base64);
                        showTopFloatNotification('✅ Profile picture updated successfully!');
                        updateUserIcon();
                        if (typeof updateNavPill === 'function') updateNavPill();
                    } else {
                        showTopFloatNotification(`❌ ${data.message}`, 'danger');
                    }
                } catch (err) {
                    console.error(err);
                    showTopFloatNotification('❌ Failed to update profile picture!', 'danger');
                }
            };
            reader.readAsDataURL(file);
        }
    }
});

// Handle modal transitions nicely to prevent background glitches
document.addEventListener('click', function(e) {
    if (e.target.id === 'openLoginModalBtn') {
        e.preventDefault();
        const regModalEl = document.getElementById('registerModal');
        const loginModalEl = document.getElementById('loginModal');
        if (regModalEl && loginModalEl) {
            bootstrap.Modal.getOrCreateInstance(regModalEl).hide();
            regModalEl.addEventListener('hidden.bs.modal', function onHide() {
                bootstrap.Modal.getOrCreateInstance(loginModalEl).show();
                regModalEl.removeEventListener('hidden.bs.modal', onHide);
            }, { once: true });
        }
    }
    
    if (e.target.id === 'openRegisterModalBtn') {
        e.preventDefault();
        const regModalEl = document.getElementById('registerModal');
        const loginModalEl = document.getElementById('loginModal');
        if (regModalEl && loginModalEl) {
            bootstrap.Modal.getOrCreateInstance(loginModalEl).hide();
            loginModalEl.addEventListener('hidden.bs.modal', function onHide() {
                bootstrap.Modal.getOrCreateInstance(regModalEl).show();
                loginModalEl.removeEventListener('hidden.bs.modal', onHide);
            }, { once: true });
        }
    }
    
    if (e.target.id === 'openForgotPasswordBtn') {
        e.preventDefault();
        const loginModalEl = document.getElementById('loginModal');
        const fpModalEl = document.getElementById('forgotPasswordModal');
        if (loginModalEl && fpModalEl) {
            bootstrap.Modal.getOrCreateInstance(loginModalEl).hide();
            loginModalEl.addEventListener('hidden.bs.modal', function onHide() {
                bootstrap.Modal.getOrCreateInstance(fpModalEl).show();
                loginModalEl.removeEventListener('hidden.bs.modal', onHide);
            }, { once: true });
        }
    }
});

// Close dropdown on click outside
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('profileDropdownMenu');
    const userBtn = document.getElementById('userAccountBtn');
    
    if (dropdown) {
        const isClickInside = dropdown.contains(e.target) || (userBtn && userBtn.contains(e.target));
        if (!isClickInside) {
            dropdown.classList.remove('show');
        }
    }
});

// Sync Products from Backend on page load
async function syncProductsFromBackend() {
    try {
        const response = await fetch('http://localhost:5000/api/products');
        const data = await response.json();
        if (data.success && data.products) {
            data.products.forEach(p => {
                p.price = 0.01;
                if (p.oldPrice) {
                    p.oldPrice = 0.02;
                }
            });
            localStorage.setItem('products', JSON.stringify(data.products));
            console.log('✅ Products synchronized from SQLite Database and price normalized!');
            
            // Update the global products arrays in-place if they exist
            if (typeof products !== 'undefined' && Array.isArray(products)) {
                products.length = 0;
                products.push(...data.products);
            }

            // Re-render pages if rendering functions are active
            if (typeof renderHomeProducts === 'function') renderHomeProducts();
            if (typeof applyFilters === 'function') {
                applyFilters();
            } else if (typeof renderProducts === 'function') {
                renderProducts(data.products);
            }
        }
    } catch (e) {
        console.warn('⚠️ Backend not reachable. Using localStorage fallback products.', e);
    }
}

// DOM Loaded Initialization
document.addEventListener('DOMContentLoaded', () => {
    setupProfileDropdown();
    updateUserIcon();
    
    // Sync products from backend database
    syncProductsFromBackend();
    
    const userBtn = document.getElementById('userAccountBtn');
    if (userBtn) {
        userBtn.addEventListener('click', function(e) {
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            if (isLoggedIn) {
                e.preventDefault();
                e.stopPropagation();
                const dropdown = document.getElementById('profileDropdownMenu');
                if (dropdown) {
                    dropdown.classList.toggle('show');
                    updateProfileDropdownContent();
                }
            } else {
                const registerModalEl = document.getElementById('registerModal');
                if (registerModalEl) {
                    e.preventDefault();
                    bootstrap.Modal.getOrCreateInstance(registerModalEl).show();
                }
            }
        });
    }
    
    // If on profile page, populate input values
    if (window.location.pathname.includes('profile.html')) {
        initProfilePage();
    }
});

// Page-level Authorization Check
(function() {
    const pathname = window.location.pathname;
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (pathname.includes('profile.html')) {
        if (!isLoggedIn) {
            window.location.href = 'login.html';
        }
    }
})();

// Expose public functions to global window context
window.togglePasswordVisibility = togglePasswordVisibility;
window.initForgotPassword = initForgotPassword;
window.fpNextFromStep1 = fpNextFromStep1;
window.fpNextFromStep2 = fpNextFromStep2;
window.fpGoBack = fpGoBack;
window.fpSubmitNewPassword = fpSubmitNewPassword;
window.updateUserIcon = updateUserIcon;
window.updateProfileDropdownContent = updateProfileDropdownContent;
window.initProfilePage = initProfilePage;
