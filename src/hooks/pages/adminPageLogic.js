// Admin page logic migrated from admin.html
import { apiUrl } from '../../utils/data';

export function initAdminPageLogic() {
        if (window.__adminPageLogicInit) return;
        window.__adminPageLogicInit = true;

        // Security: role-based admin check (React layer also enforces this)
        function verifyAdminAuth() {
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            const userRole = localStorage.getItem('userRole') || '';

            const accessDeniedScreen = document.getElementById('accessDeniedScreen');
            const adminAppContent = document.getElementById('adminAppContent');

            if (!isLoggedIn || userRole !== 'admin') {
                if (accessDeniedScreen) accessDeniedScreen.style.display = 'flex';
                if (adminAppContent) adminAppContent.style.display = 'none';

                setTimeout(() => {
                    window.location.href = '/';
                }, 3500);
                return false;
            }

            if (accessDeniedScreen) accessDeniedScreen.style.display = 'none';
            if (adminAppContent) adminAppContent.style.display = 'flex';

            let adminName = localStorage.getItem('userFullName') || 'Abdirahman';
            if (adminName === 'Admin User') {
                adminName = 'Abdirahman';
                localStorage.setItem('userFullName', 'Abdirahman');
            }
            const adminAvatar = localStorage.getItem('userAvatar') || `https://ui-avatars.com/api/?name=${encodeURIComponent(adminName)}&background=073D35&color=ffffff&bold=true&size=128`;

            const sidebarNameEl = document.getElementById('adminSidebarName');
            if (sidebarNameEl) sidebarNameEl.innerText = adminName;
            const sidebarAvatarEl = document.getElementById('adminSidebarAvatar');
            if (sidebarAvatarEl) sidebarAvatarEl.src = adminAvatar;
            return true;
        }

        // Global State variables
        let products = [];
        let orders = [];
        let users = [];
        let supportTickets = [];

        let salesChartInstance = null;
        let categoryChartInstance = null;
        let tempBase64Image = ""; // Holds base64 upload buffer
        let globalDataFetchedAt = 0;
        let globalDataLoading = null;
        const GLOBAL_DATA_TTL = 60000;
        const loadedScopes = new Set();

        const TAB_SCOPES = {
            dashboard: ['recentOrders', 'support'],
            products: ['products'],
            orders: ['orders'],
            users: ['users'],
            stock: ['products'],
            payments: ['orders'],
            delivery: ['orders'],
            support: ['support'],
            settings: [],
            reviews: [],
        };

        let cachedDashboardStats = null;
        let adminLoadingTimer = null;

        function showAdminDataLoading() {
            if (adminLoadingTimer) clearTimeout(adminLoadingTimer);
            adminLoadingTimer = setTimeout(() => {
                const el = document.getElementById('adminDataLoading');
                if (el) el.style.display = 'flex';
            }, 350);
        }

        function hideAdminDataLoading() {
            if (adminLoadingTimer) {
                clearTimeout(adminLoadingTimer);
                adminLoadingTimer = null;
            }
            const el = document.getElementById('adminDataLoading');
            if (el) el.style.display = 'none';
        }

        // Load data from API (scoped per tab to reduce MongoDB load)
        async function loadGlobalData(force = false, scopes = ['products', 'orders', 'users', 'support']) {
            const requested = scopes.length ? scopes : ['products', 'orders', 'users', 'support'];
            const missing = requested.filter((scope) => force || !loadedScopes.has(scope));

            if (!missing.length && globalDataFetchedAt && Date.now() - globalDataFetchedAt < GLOBAL_DATA_TTL) {
                return;
            }
            if (globalDataLoading) {
                await globalDataLoading;
                if (!missing.length) return;
            }

            globalDataLoading = (async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const headers = { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    };

                    const fetchers = [];
                    if (missing.includes('products')) {
                        fetchers.push(
                            fetch(apiUrl('/api/products')).then((r) => r.json()).then((d) => {
                                if (d.success) {
                                    products = d.products;
                                    loadedScopes.add('products');
                                }
                            })
                        );
                    }
                    if (missing.includes('orders')) {
                        fetchers.push(
                            fetch(apiUrl('/api/orders?limit=500'), { headers }).then((r) => r.json()).then((d) => {
                                if (d.success) {
                                    orders = d.orders;
                                    loadedScopes.add('orders');
                                }
                            })
                        );
                    }
                    if (missing.includes('recentOrders')) {
                        fetchers.push(
                            fetch(apiUrl('/api/orders?limit=8'), { headers }).then((r) => r.json()).then((d) => {
                                if (d.success) {
                                    orders = d.orders;
                                    loadedScopes.add('recentOrders');
                                }
                            })
                        );
                    }
                    if (missing.includes('users')) {
                        fetchers.push(
                            fetch(apiUrl('/api/auth/users'), { headers }).then((r) => r.json()).then((d) => {
                                if (d.success) {
                                    users = d.users;
                                    loadedScopes.add('users');
                                }
                            })
                        );
                    }
                    if (missing.includes('support')) {
                        fetchers.push(
                            fetch(apiUrl('/api/support/admin/chats'), { headers }).then((r) => r.json()).then((d) => {
                                if (d.success) {
                                    supportTickets = d.tickets.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
                                    loadedScopes.add('support');
                                }
                            })
                        );
                    }

                    await Promise.all(fetchers);
                    
                    if (missing.includes('support') && typeof connectSupportSse === 'function') {
                        connectSupportSse();
                    }
                    
                    globalDataFetchedAt = Date.now();
                    return;
                } catch (err) {
                    console.warn("Could not load from backend API, falling back to localStorage:", err);
                    notifyAdminWarning('Could not sync all data from MongoDB. Showing cached or partial data.');
                }
            }

            // FALLBACK TO LOCAL STORAGE
            let localProducts = [];
            try {
                localProducts = JSON.parse(localStorage.getItem('products')) || [];
            } catch (e) {}

            const homepageProductTitles = [
                "Luxury Sofa Set",
                "Dining Table",
                "King Size Bed",
                "Office Chair",
                "Outdoor Swing Chair"
            ];
            const hasAllTitles = localProducts.length === 5 && homepageProductTitles.every(t => localProducts.some(p => p.title === t));

            if (!hasAllTitles) {
                const syncProducts = [
                    {
                        id: 1,
                        title: "Luxury Sofa Set",
                        category: "living-room",
                        label: "Living Room",
                        materialType: "wood",
                        material: "Solid Walnut Frame, Premium Linen Fabric",
                        price: 650,
                        oldPrice: 750,
                        discount: "13% off",
                        rating: 4.8,
                        popularity: 92,
                        isNewest: true,
                        stock: "in-stock",
                        stockVal: 15,
                        status: "Active",
                        availability: "In Stock",
                        images: [
                            "living-room/luxury-sofa-set.png",
                            "living-room/walnut-frame-sofa-set-angle-1.jpeg.jpeg",
                            "living-room/walnut-frame-sofa-set-angle-2.jpeg.jpeg",
                            "living-room/walnut-frame-sofa-set-angle-3.jpeg.jpeg"
                        ],
                        color: "Warm Beige"
                    },
                    {
                        id: 2,
                        title: "Dining Table",
                        category: "dining-room",
                        label: "Dining Room",
                        materialType: "wood",
                        material: "Natural Oak Solid Wood, Modern Metal Legs",
                        price: 350,
                        oldPrice: 400,
                        discount: "12% off",
                        rating: 4.6,
                        popularity: 85,
                        isNewest: false,
                        stock: "in-stock",
                        stockVal: 8,
                        status: "Active",
                        availability: "In Stock",
                        images: [
                            "dining-room/dining-table.png",
                            "dining-room/walnut-sage-dining-set-angle-1.jpeg.jpeg",
                            "dining-room/walnut-sage-dining-set-angle-2.jpeg.jpeg",
                            "dining-room/walnut-sage-dining-set-angle-3.jpeg.jpeg"
                        ],
                        color: "Oak Brown"
                    },
                    {
                        id: 3,
                        title: "King Size Bed",
                        category: "bedroom",
                        label: "Bedroom",
                        materialType: "velvet",
                        material: "Premium Velvet Upholstery, Heavy Duty Slats",
                        price: 550,
                        oldPrice: 650,
                        discount: "15% off",
                        rating: 4.9,
                        popularity: 94,
                        isNewest: true,
                        stock: "in-stock",
                        stockVal: 6,
                        status: "Active",
                        availability: "In Stock",
                        images: [
                            "bedroom/king-size-bed.png",
                            "bedroom/blush-velvet-arch-bed-angle-1.jpeg.jpeg",
                            "bedroom/blush-velvet-arch-bed-angle-2.jpeg.jpeg",
                            "bedroom/sage-wood-platform-bed-angle-1.jpeg.jpeg"
                        ],
                        color: "Charcoal Gray"
                    },
                    {
                        id: 4,
                        title: "Office Chair",
                        category: "office",
                        label: "Office",
                        materialType: "nylon",
                        material: "High-Back Mesh, Lumbar Support, Adjustable Armrests",
                        price: 120,
                        oldPrice: 150,
                        discount: "20% off",
                        rating: 4.5,
                        popularity: 80,
                        isNewest: false,
                        stock: "out-of-stock",
                        stockVal: 0,
                        status: "Active",
                        availability: "Out of Stock",
                        images: [
                            "office/office-chair.png"
                        ],
                        color: "Matte Black"
                    },
                    {
                        id: 5,
                        title: "Outdoor Swing Chair",
                        category: "outdoor",
                        label: "Outdoor",
                        materialType: "rattan",
                        material: "All-Weather Wicker Rattan, Waterproof Cushions",
                        price: 220,
                        oldPrice: 260,
                        discount: "15% off",
                        rating: 4.3,
                        popularity: 75,
                        isNewest: false,
                        stock: "in-stock",
                        stockVal: 3,
                        status: "Active",
                        availability: "In Stock",
                        images: [
                            "outdoor/outdoor-swing-chair.png",
                            "outdoor/sunhaven-outdoor-lounge-set-angle-1.jpeg.jpeg",
                            "outdoor/sunhaven-outdoor-lounge-set-angle-2.jpeg.jpeg",
                            "outdoor/sunhaven-outdoor-lounge-set-angle-3.jpeg.jpeg"
                        ],
                        color: "Natural Rattan"
                    }
                ];
                localProducts = syncProducts;
                localStorage.setItem('products', JSON.stringify(localProducts));
            }

            localProducts.forEach(p => {
                const stockVal = typeof p.stockVal === 'number' ? p.stockVal : (p.stock === 'in-stock' ? 12 : 0);
                p.stockVal = stockVal;
                p.stock = stockVal > 0 ? 'in-stock' : 'out-of-stock';
                p.availability = stockVal > 0 ? 'In Stock' : 'Out of Stock';
            });

            products = localProducts;
            orders = JSON.parse(localStorage.getItem('orders')) || [];
            users = JSON.parse(localStorage.getItem('users')) || [];
            globalDataFetchedAt = Date.now();
            })();

            try {
                await globalDataLoading;
            } finally {
                globalDataLoading = null;
            }
        }

        // Save back to LocalStorage
        function saveProductsToLocalStorage() {
            localStorage.setItem('products', JSON.stringify(products));
        }

        function saveOrdersToLocalStorage() {
            localStorage.setItem('orders', JSON.stringify(orders));
        }

        function saveUsersToLocalStorage() {
            localStorage.setItem('users', JSON.stringify(users));
        }

        // Toast Messages helper
        function showAdminNotification(message, tone = 'success') {
            const toast = document.createElement('div');
            const toneClass = tone === 'danger' ? 'float-notif--danger' : tone === 'warning' ? 'float-notif--warning' : '';
            toast.className = `float-notif ${toneClass}`.trim();
            const icon = tone === 'danger' ? 'fa-circle-xmark' : tone === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-check';
            const iconColor = tone === 'danger' ? '#fecaca' : tone === 'warning' ? '#fde68a' : 'var(--gold)';
            toast.innerHTML = `<i class="fa-solid ${icon}" style="color:${iconColor}; font-size:1.2rem;"></i> <span>${message}</span>`;
            document.body.appendChild(toast);

            setTimeout(() => {
                toast.classList.add('hide');
                setTimeout(() => toast.remove(), 400);
            }, tone === 'danger' ? 4500 : 3000);
        }

        function notifyAdminError(message) {
            const text = String(message || 'Something went wrong.');
            showAdminNotification(text.startsWith('❌') ? text : `❌ ${text}`, 'danger');
        }

        function notifyAdminWarning(message) {
            showAdminNotification(message.startsWith('⚠') ? message : `⚠️ ${message}`, 'warning');
        }

        // Log out admin
        function adminLogout() {
            if (confirm("Are you sure you want to log out of the Admin account?")) {
                localStorage.isLoggingOut = true;
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('currentUser');
                localStorage.removeItem('userFullName');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userPhone');
                localStorage.removeItem('userAvatar');
                localStorage.removeItem('userAddress');
                delete localStorage.isLoggingOut;

                showAdminNotification("Successfully logged out!");
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            }
        }

        // Navigation Controller
        async function switchTab(tabName) {
            const adminMainEl = document.querySelector('.admin-main');
            if (adminMainEl) {
                if (tabName === 'support') {
                    adminMainEl.classList.add('support-mode');
                } else {
                    adminMainEl.classList.remove('support-mode');
                }
            }

            document.querySelectorAll('.menu-link').forEach((link) => {
                const tab = link.getAttribute('data-tab');
                if (tab) {
                    link.classList.toggle('active', tab === tabName);
                }
            });

            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('active');
            });
            const activePane = document.getElementById('tab-' + (tabName === 'users' ? 'users' : tabName));
            if (activePane) activePane.classList.add('active');

            const titles = {
                'dashboard': ['Dashboard Overview', "Welcome back, Admin. Here's what's happening today."],
                'products': ['Manage Products', 'Add, edit, or delete items in the store product catalog.'],
                'orders': ['Manage Orders', 'Track payments, driver assignments, and delivery stages.'],
                'users': ['Manage Users', 'View, check, or delete registered user accounts.'],
                'stock': ['Stock Management', 'Check inventory counts, low stock alerts and quick updates.'],
                'payments': ['Payments & billing', 'Inspect transaction history, mobile money shares, and verify status.'],
                'delivery': ['Delivery dispatch center', 'Assign couriers, edit arrival times and track delivery stage.'],
                'support': ['Support & tickets', 'Respond to client inquiries and check feedback tickets.'],
                'reviews': ['Product reviews & ratings', 'Moderate customer feedback and review scores.'],
                'settings': ['System Settings', 'Configure delivery fees, store availability, and reset databases.']
            };

            const displayTitleEl = document.getElementById('tabDisplayTitle');
            const displaySubEl = document.getElementById('tabDisplaySub');
            if (displayTitleEl) displayTitleEl.innerText = titles[tabName][0];
            if (displaySubEl) displaySubEl.innerText = titles[tabName][1];

            window.dispatchEvent(new CustomEvent('admin-tab-changed', { detail: tabName }));

            if (tabName !== 'support') {
                if (window.adminChatPollIntervalId) {
                    clearInterval(window.adminChatPollIntervalId);
                    window.adminChatPollIntervalId = null;
                }
            }

            showAdminDataLoading();
            try {
                const scopes = TAB_SCOPES[tabName] || ['products', 'orders', 'users', 'support'];
                await loadGlobalData(false, scopes);

                if (tabName === 'dashboard') {
                    await fetchDashboardStats();
                    renderOverviewStats();
                } else if (tabName === 'products') {
                    renderProductsTable(products);
                } else if (tabName === 'orders') {
                    const queryEl = document.getElementById('orderSearchQuery');
                    if (queryEl) queryEl.value = '';
                    const statusEl = document.getElementById('orderFilterStatus');
                    if (statusEl) statusEl.value = 'all';
                    const paymentEl = document.getElementById('orderFilterPayment');
                    if (paymentEl) paymentEl.value = 'all';
                    const dateEl = document.getElementById('orderFilterDate');
                    if (dateEl) dateEl.value = 'all';
                    loadOrderStats();
                    onOrderFilterChange();
                } else if (tabName === 'users') {
                    renderCustomersTable(users);
                } else if (tabName === 'stock') {
                    renderStockTable();
                } else if (tabName === 'payments') {
                    renderPaymentsTable();
                } else if (tabName === 'delivery') {
                    loadApprovedDrivers().then(() => renderDeliveryTable());
                } else if (tabName === 'support') {
                    renderSupportTable();
                } else if (tabName === 'reviews') {
                    renderReviewsTable();
                }
            } finally {
                hideAdminDataLoading();
            }
        }

        // Render Stats cards
        function updateTrendBadge(elementId, trendPercent, labelWhenZero) {
            const el = document.getElementById(elementId);
            if (!el) return;
            if (trendPercent === null || trendPercent === undefined) {
                if (labelWhenZero) el.textContent = labelWhenZero;
                return;
            }
            const up = trendPercent >= 0;
            el.className = `stat-trend ${up ? 'up' : 'down'}`;
            el.style.background = up ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
            el.style.color = up ? '#10b981' : '#ef4444';
            el.innerHTML = `<i class="fa-solid fa-arrow-${up ? 'up' : 'down'}"></i> ${up ? '+' : ''}${trendPercent}%`;
        }

        async function fetchDashboardStats() {
            cachedDashboardStats = await applyDashboardStatsFromApi();
            return cachedDashboardStats;
        }

        async function applyDashboardStatsFromApi() {
            const token = localStorage.getItem('token');
            if (!token) return null;
            try {
                const res = await fetch(apiUrl('/api/admin/dashboard-stats'), {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (!data.success) return null;

                const s = data.stats;
                const ordersEl = document.getElementById('statTotalOrders');
                const usersEl = document.getElementById('statTotalCustomers');
                const salesEl = document.getElementById('statTotalSales');
                const productsEl = document.getElementById('statActiveProducts');

                if (ordersEl) ordersEl.innerText = (s.totalOrders || 0).toLocaleString();
                if (usersEl) usersEl.innerText = (s.totalUsers || 0).toLocaleString();
                if (salesEl) {
                    salesEl.innerText = '$' + Number(s.revenue || 0).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    });
                }
                if (productsEl) productsEl.innerText = (s.totalProducts || 0).toLocaleString();

                updateTrendBadge('statTrendOrders', s.trends?.orders);
                updateTrendBadge('statTrendUsers', s.trends?.users);
                updateTrendBadge('statTrendRevenue', s.trends?.revenue);

                const statsTotal = document.getElementById('statsTotalOrdersCount');
                const statsPending = document.getElementById('statsPendingOrdersCount');
                const statsDelivered = document.getElementById('statsDeliveredOrdersCount');
                const statsCancelled = document.getElementById('statsCancelledOrdersCount');

                if (statsTotal) statsTotal.textContent = (s.totalOrders || 0).toLocaleString();
                if (statsPending) statsPending.textContent = (s.pendingOrders || 0).toLocaleString();
                if (statsDelivered) statsDelivered.textContent = (s.deliveredOrders || 0).toLocaleString();
                if (statsCancelled) statsCancelled.textContent = (s.cancelledOrders || 0).toLocaleString();

                updateTrendBadge('statsTotalOrdersTrend', s.trends?.orders);
                updateTrendBadge('statsDeliveredOrdersTrend', s.trends?.orders);

                const apiBadge = document.getElementById('apiConnectionBadge');
                if (apiBadge) {
                    apiBadge.textContent = `MongoDB · ${s.openSupportTickets || 0} open tickets · ${s.unreadAdminNotifications || 0} alerts`;
                }

                return s;
            } catch (err) {
                console.warn('Dashboard stats API unavailable:', err);
                return null;
            }
        }

        function renderOverviewStats() {
            // Stat cards are filled by fetchDashboardStats → applyDashboardStatsFromApi

            // Render recent orders table rows (max 5)
            const recentOrders = orders.slice(0, 5);
            const ordersContainer = document.getElementById('recentOrdersListContainer');
            if (ordersContainer) {
                ordersContainer.innerHTML = "";
                if (recentOrders.length === 0) {
                    ordersContainer.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3" style="font-size:0.8rem;">No recent orders.</td></tr>`;
                } else {
                    recentOrders.forEach(order => {
                        const status = getOrderStatusLabel(order);
                        const payment = getOrderPaymentLabel(order);
                        
                        let statusBadgeClass = 'badge-status-pending';
                        if (status === 'Delivered') statusBadgeClass = 'badge-status-delivered';
                        else if (status === 'Shipped') statusBadgeClass = 'badge-status-shipped';
                        else if (status === 'Cancelled') statusBadgeClass = 'badge-status-cancelled';
                        else if (status === 'Processing') statusBadgeClass = 'badge-status-processing';

                        const index = orders.findIndex(o => o.id === order.id);

                        ordersContainer.innerHTML += `
                            <tr>
                                <td class="fw-bold text-success font-monospace" style="font-size: 0.8rem;">${order.id}</td>
                                <td class="fw-semibold text-dark" style="font-size: 0.8rem;">${order.customer}</td>
                                <td>
                                    <span class="badge ${statusBadgeClass} border-0 px-2 py-1 fw-bold" style="font-size: 0.68rem; border-radius: 6px;">${status}</span>
                                </td>
                                <td class="fw-bold text-dark" style="font-size: 0.8rem;">${order.amount}</td>
                                <td class="text-secondary" style="font-size: 0.8rem;">${order.date || 'May 22, 2026'}</td>
                                <td>
                                    <button class="btn-table-action view" onclick="openOrderEditModal(${index})" title="View Details" style="background: none; border: none; padding: 0; color: #4B5563; font-size: 0.95rem;">
                                        <i class="fa-regular fa-eye"></i>
                                    </button>
                                </td>
                            </tr>
                        `;
                    });
                }
            }

            // 6. Render recent support requests list (max 4)
            const tickets = supportTickets;
            const recentTickets = tickets.slice(0, 4);
            const supportContainer = document.getElementById('recentSupportListContainer');
            if (supportContainer) {
                supportContainer.innerHTML = "";
                if (recentTickets.length === 0) {
                    supportContainer.innerHTML = `<div class="text-center text-muted py-3" style="font-size:0.8rem;">No support requests.</div>`;
                } else {
                    recentTickets.forEach((tkt, idx) => {
                        const name = tkt.name || 'Anonymous';
                        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                        
                        let statusBadge = '';
                        if (tkt.status === 'Open' || tkt.status === 'New') {
                            statusBadge = `<span class="badge bg-danger text-white border-0 px-2 py-0.5 fw-bold" style="font-size: 0.62rem; border-radius: 4px;">New</span>`;
                        } else if (tkt.status === 'Pending' || tkt.status === 'In Progress') {
                            statusBadge = `<span class="badge bg-warning text-dark border-0 px-2 py-0.5 fw-bold" style="font-size: 0.62rem; border-radius: 4px;">In Progress</span>`;
                        } else {
                            statusBadge = `<span class="badge bg-success text-white border-0 px-2 py-0.5 fw-bold" style="font-size: 0.62rem; border-radius: 4px; background-color: #10b981 !important;">Resolved</span>`;
                        }

                        // Lookup custom image avatars to match mockup exactly
                        let avatarHTML = '';
                        if (name.toLowerCase() === 'hodan ali') {
                            avatarHTML = `<img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" alt="${name}" class="rounded-circle" style="width: 32px; height: 32px; object-fit: cover;">`;
                        } else if (name.toLowerCase() === 'mustafa omar') {
                            avatarHTML = `<img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" alt="${name}" class="rounded-circle" style="width: 32px; height: 32px; object-fit: cover;">`;
                        } else {
                            avatarHTML = `<div class="initials-avatar fw-bold text-white d-flex align-items-center justify-content-center" style="width: 32px; height: 32px; border-radius: 50%; font-size: 0.72rem; background-color: #073D35;">${initials}</div>`;
                        }

                        let timeStr = 'Just now';
                        if (tkt.lastMessageAt) {
                            const diffMs = new Date() - new Date(tkt.lastMessageAt);
                            const diffMins = Math.floor(diffMs / 60000);
                            const diffHours = Math.floor(diffMins / 60);
                            if (diffMins < 1) timeStr = 'Just now';
                            else if (diffMins < 60) timeStr = `${diffMins}m ago`;
                            else if (diffHours < 24) timeStr = `${diffHours}h ago`;
                            else timeStr = new Date(tkt.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
                        }
                        
                        const msgSnippet = tkt.lastMessageText || tkt.subject || 'No messages';
                        
                        supportContainer.innerHTML += `
                            <div class="dashboard-list-item d-flex align-items-center justify-content-between py-2 border-bottom" style="cursor: pointer;" onclick="switchTab('support').then(() => selectSupportTicket('${tkt.id}'))">
                                <div class="d-flex align-items-center gap-2">
                                    ${avatarHTML}
                                    <div>
                                        <span class="fw-bold text-dark d-block" style="font-size: 0.78rem; line-height: 1.2;">${name}</span>
                                        <span class="text-muted d-block text-truncate" style="font-size: 0.7rem; max-width: 150px;" title="${msgSnippet}">${msgSnippet}</span>
                                    </div>
                                </div>
                                <div class="text-end">
                                    <span class="text-muted d-block" style="font-size: 0.68rem; font-weight: 500; margin-bottom: 2px;">${timeStr}</span>
                                    ${statusBadge}
                                </div>
                            </div>
                        `;
                    });
                    const lastChild = supportContainer.lastElementChild;
                    if (lastChild) lastChild.classList.remove('border-bottom');
                }
            }

            // Set current Date Display
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            const today = new Date();
            const dateStr = today.toLocaleDateString('en-US', options);
            const dateDisplay = document.getElementById('currentDateDisplay');
            if (dateDisplay) dateDisplay.textContent = dateStr;

            // Set greeting name
            const adminName = localStorage.getItem('userFullName') || 'Abdirahman';
            const greetingName = document.getElementById('adminGreetingName');
            if (greetingName) greetingName.textContent = adminName;
            const headerName = document.getElementById('headerAdminName');
            if (headerName) headerName.textContent = adminName;
        }

        // Initialize and Update Charts
        function initCharts() {
            // Destroy existing charts to prevent memory leaks or rendering errors on data change
            if (salesChartInstance) salesChartInstance.destroy();
            if (categoryChartInstance) categoryChartInstance.destroy();

            // 1. Sales Trend Line Chart (Last 5 orders or by date)
            const salesCtx = document.getElementById('salesLineChart').getContext('2d');

            // Generate sales metrics grouped by date (prefer API aggregation)
            const dateMap = cachedDashboardStats?.salesByDate
                ? { ...cachedDashboardStats.salesByDate }
                : {};
            if (!Object.keys(dateMap).length) {
                orders.forEach(order => {
                    if (order.date) {
                        const amount = typeof order.amount === 'number'
                            ? order.amount
                            : Number(String(order.amount || '').replace(/[\$,]/g, ''));
                        dateMap[order.date] = (dateMap[order.date] || 0) + (isNaN(amount) ? 0 : amount);
                    }
                });
            }

            // Sort dates
            const sortedDates = Object.keys(dateMap).sort();
            const salesValues = sortedDates.map(d => dateMap[d]);

            // Defaults if no orders
            const chartLabels = sortedDates.length > 0 ? sortedDates : ["No Data"];
            const chartData = salesValues.length > 0 ? salesValues : [0];

            salesChartInstance = new Chart(salesCtx, {
                type: 'line',
                data: {
                    labels: chartLabels,
                    datasets: [{
                        label: 'Sales Revenue ($)',
                        data: chartData,
                        borderColor: '#073D35',
                        backgroundColor: 'rgba(7, 61, 53, 0.05)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.35,
                        pointBackgroundColor: '#D8A128',
                        pointBorderColor: '#073D35',
                        pointHoverRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0,0,0,0.03)' }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });

            // 2. Category Doughnut Chart (Category distribution)
            const catCanvas = document.getElementById('categoryDoughnutChart');
            if (catCanvas) {
                const catCtx = catCanvas.getContext('2d');

                // Group products by category label
                const catCount = {};
                products.forEach(p => {
                    const category = p.category ? p.category.toLowerCase() : 'other';
                    catCount[category] = (catCount[category] || 0) + 1;
                });

                const catLabels = Object.keys(catCount).map(c => c.charAt(0).toUpperCase() + c.slice(1));
                const catData = Object.values(catCount);

                const displayCatLabels = catLabels.length > 0 ? catLabels : ["No Products"];
                const displayCatData = catData.length > 0 ? catData : [1];
                const bgColors = catLabels.length > 0 ?
                    ['#073D35', '#D8A128', '#0F6F64', '#315C43', '#854d0e', '#cbd5e1'] :
                    ['#e2e8f0'];

                categoryChartInstance = new Chart(catCtx, {
                    type: 'doughnut',
                    data: {
                        labels: displayCatLabels,
                        datasets: [{
                            data: displayCatData,
                            backgroundColor: bgColors,
                            borderWidth: 2,
                            hoverOffset: 8
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    font: { size: 11, weight: 'bold' },
                                    boxWidth: 12
                                }
                            }
                        },
                        cutout: '65%'
                    }
                });
            }
        }

        // ==================== PRODUCT ACTIONS AND RENDER ====================
        function formatAdminPrice(price) {
            const n = Number(price);
            if (Number.isNaN(n)) return '$0';
            if (n > 0 && n < 1) return `$${n.toFixed(3)}`;
            return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        async function populateProductCategorySelect(selectedValue = '') {
            const select = document.getElementById('formProductCategory');
            if (!select) return;

            const fallback = [
                ['chair', 'Chair'],
                ['bedroom', 'Bedroom'],
                ['living-room', 'Living Room'],
                ['dining-room', 'Dining Room'],
                ['outdoor', 'Outdoor'],
                ['office', 'Office'],
            ];

            let options = fallback;
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await fetch(apiUrl('/api/categories/all'), {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const data = await res.json();
                    if (data.success && Array.isArray(data.categories) && data.categories.length > 0) {
                        options = data.categories
                            .filter((cat) => cat.active !== false)
                            .sort((a, b) => (a.order || 0) - (b.order || 0))
                            .map((cat) => [cat.slug, cat.name]);
                    }
                } catch {
                    // keep fallback list
                }
            }

            select.innerHTML = options
                .map(([value, label]) => `<option value="${value}">${label}</option>`)
                .join('');
            if (selectedValue) select.value = selectedValue;
        }

        function renderProductsTable(list) {
            const tbody = document.getElementById('productsTableBody');
            tbody.innerHTML = "";

            if (list.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No matching products found.</td></tr>`;
                return;
            }

            list.forEach(p => {
                const displayPrice = formatAdminPrice(p.price);
                const stockVal = typeof p.stockVal === 'number' ? p.stockVal : (p.stock === 'in-stock' ? 12 : 0);

                let statusLabel = p.status || (stockVal > 0 ? 'Active' : 'Inactive');
                let statusClass = statusLabel === 'Active' ? 'instock' : 'outofstock';
                let statusStyle = statusLabel === 'Active' 
                    ? 'background-color: #e8f7ef; color: #10b981; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 0.78rem; border: none; display: inline-block;' 
                    : 'background-color: #fde8e8; color: #ef4444; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 0.78rem; border: none; display: inline-block;';

                const stockDisplay = stockVal <= 5 && stockVal > 0
                    ? `<span class="text-warning fw-bold">${stockVal}</span> <small>(Low)</small>`
                    : `<span>${stockVal}</span>`;

                // Locate the index of this product in global products array
                const index = products.findIndex(item => item.id === p.id);

                // Capitalize Category correctly
                const catText = p.category === 'living-room' ? 'Living Room' : 
                                p.category === 'dining-room' ? 'Dining Room' : 
                                p.category === 'bedroom' ? 'Bedroom' : 
                                p.category === 'outdoor' ? 'Outdoor' : 
                                p.category === 'office' ? 'Office' : 
                                p.category.charAt(0).toUpperCase() + p.category.slice(1);

                tbody.innerHTML += `
                    <tr>
                        <td>
                            <div class="td-product-info" style="display: flex; align-items: center; gap: 12px;">
                                <img src="${p.images && p.images[0] ? p.images[0] : 'hero1.jpeg'}" alt="Thumb" class="td-product-img" onerror="this.src='hero1.jpeg'">
                                <span class="td-product-title" style="font-weight: 700; color: #111827;">${p.title}</span>
                            </div>
                        </td>
                        <td><span style="color: #4b5563; font-weight: 500;">${catText}</span></td>
                        <td style="font-weight: 700; color: #111827;">${displayPrice}</td>
                        <td style="color: #4b5563; font-weight: 500;">${stockDisplay}</td>
                        <td><span class="badge-status ${statusClass}" style="${statusStyle}">${statusLabel}${p.isNewest ? ' · New' : ''}</span></td>
                        <td>
                            <div class="actions-btn-group" style="display: flex; gap: 8px;">
                                <button class="btn-table-action view" onclick="openViewProductModal(${p.id})" title="View Details" style="background: none; border: none; padding: 0; color: #073D35; font-size: 0.95rem;">
                                    <i class="fa-regular fa-eye"></i>
                                </button>
                                <button class="btn-table-action edit" onclick="openEditProductModal(${index})" title="Edit"><i class="fa-solid fa-pencil"></i></button>
                                <button class="btn-table-action delete" onclick="deleteProduct(${index})" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
                            </div>
                        </td>
                    </tr>
                `;
            });
        }

        function filterProductsTable() {
            const query = document.getElementById('productSearchQuery').value.toLowerCase().trim();
            const category = document.getElementById('productFilterCategory').value;
            const status = document.getElementById('productFilterStatus') ? document.getElementById('productFilterStatus').value : 'all';
            const stock = document.getElementById('productFilterStock') ? document.getElementById('productFilterStock').value : 'all';

            const filtered = products.filter(p => {
                const matchQuery = p.title.toLowerCase().includes(query) ||
                    (p.material && p.material.toLowerCase().includes(query)) ||
                    String(p.id).includes(query);

                const matchCategory = category === 'all' || p.category.toLowerCase() === category.toLowerCase();

                const stockVal = typeof p.stockVal === 'number' ? p.stockVal : (p.stock === 'in-stock' ? 12 : 0);
                const currentStatus = p.status || (stockVal > 0 ? 'Active' : 'Inactive');
                const matchStatus = status === 'all' || currentStatus.toLowerCase() === status.toLowerCase();

                const currentStockStatus = stockVal > 0 ? 'in-stock' : 'out-of-stock';
                const matchStock = stock === 'all' || currentStockStatus === stock;

                return matchQuery && matchCategory && matchStatus && matchStock;
            });

            renderProductsTable(filtered);
        }

        // Add Product Modal Trigger
        function openAddProductModal() {
            document.getElementById('productForm').reset();
            document.getElementById('formProductId').value = "";
            document.getElementById('productModalTitle').innerText = "Add New Product";
            document.getElementById('formProductStockVal').value = 10;
            document.getElementById('formProductStatus').value = 'Active';
            document.getElementById('formProductIsNewest').checked = false;
            tempBase64Image = "";

            populateProductCategorySelect().then(() => {
                const modal = new bootstrap.Modal(document.getElementById('productFormModal'));
                modal.show();
            });
        }

        // Edit Product Modal Trigger
        function openEditProductModal(index) {
            const p = products[index];
            if (!p) return;

            document.getElementById('formProductId').value = index;
            document.getElementById('formProductTitle').value = p.title;
            document.getElementById('formProductMaterialType').value = p.materialType || 'wood';
            document.getElementById('formProductPrice').value = p.price;
            document.getElementById('formProductOldPrice').value = p.oldPrice || "";
            document.getElementById('formProductColor').value = p.color || "";
            document.getElementById('formProductStockVal').value = typeof p.stockVal === 'number'
                ? p.stockVal
                : (p.stock === 'in-stock' ? 10 : 0);
            document.getElementById('formProductStatus').value = p.status || 'Active';
            document.getElementById('formProductIsNewest').checked = Boolean(p.isNewest);
            document.getElementById('formProductMaterialSpec').value = p.material;
            document.getElementById('formProductDimensions').value = p.dimensions || "";
            document.getElementById('formProductDescription').value = p.description || "";

            populateProductCategorySelect(p.category).then(() => {
                document.getElementById('formProductImageUrl').value = p.images && p.images[0] ? p.images[0] : "";
                document.getElementById('productModalTitle').innerText = "Edit Product: " + p.title;
                tempBase64Image = "";

                const modal = new bootstrap.Modal(document.getElementById('productFormModal'));
                modal.show();
            });
        }

        function openViewProductModal(productId) {
            const modalEl = document.getElementById('productDetailsModal');
            const bodyEl = document.getElementById('productDetailsModalBody');
            const titleEl = document.getElementById('productDetailsModalTitle');
            if (!modalEl || !bodyEl) return;

            bodyEl.innerHTML = `<div class="text-center text-muted py-4"><i class="fa-solid fa-spinner fa-spin me-2"></i>Loading product details...</div>`;
            const modal = new bootstrap.Modal(modalEl);
            modal.show();

            const token = localStorage.getItem('token');
            fetch(apiUrl(`/api/products/${productId}/details`), {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => res.json())
                .then((data) => {
                    if (!data.success) {
                        bodyEl.innerHTML = `<div class="alert alert-danger mb-0">${data.message || 'Failed to load product.'}</div>`;
                        return;
                    }

                    const p = data.product;
                    const stats = data.stats || {};
                    titleEl.innerText = `Product Details — ${p.title}`;

                    const catText = p.category === 'living-room' ? 'Living Room'
                        : p.category === 'dining-room' ? 'Dining Room'
                        : p.category?.charAt(0).toUpperCase() + (p.category?.slice(1) || '');

                    const statusBadge = (p.status || 'Active') === 'Active'
                        ? `<span class="badge bg-success-subtle text-success">Active</span>`
                        : `<span class="badge bg-danger-subtle text-danger">Inactive</span>`;

                    const stockBadge = (stats.stockVal || 0) <= 0
                        ? `<span class="badge bg-danger-subtle text-danger">Out of Stock</span>`
                        : stats.lowStock
                            ? `<span class="badge bg-warning-subtle text-warning">Low Stock (${stats.stockVal})</span>`
                            : `<span class="badge bg-success-subtle text-success">In Stock (${stats.stockVal})</span>`;

                    const reviewsHtml = (data.recentReviews || []).length
                        ? data.recentReviews.map((r) => `
                            <div class="border-bottom pb-2 mb-2">
                                <div class="d-flex justify-content-between">
                                    <span class="fw-semibold">${r.userName || 'Customer'}</span>
                                    <span class="text-warning">${'★'.repeat(r.rating || 0)}</span>
                                </div>
                                <div class="text-secondary small">${r.comment || ''}</div>
                                <div class="text-muted" style="font-size: 0.72rem;">${r.status || 'pending'}</div>
                            </div>
                        `).join('')
                        : `<p class="text-muted mb-0">No reviews yet.</p>`;

                    const ordersHtml = (data.recentOrders || []).length
                        ? `<div class="table-responsive"><table class="table table-sm"><thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead><tbody>${data.recentOrders.map((o) => `
                            <tr>
                                <td class="fw-semibold">${o.id}</td>
                                <td>${o.customer}</td>
                                <td>$${Number(o.amount || 0).toFixed(3)}</td>
                                <td>${o.status || '—'}</td>
                            </tr>
                        `).join('')}</tbody></table></div>`
                        : `<p class="text-muted mb-0">No orders for this product yet.</p>`;

                    bodyEl.innerHTML = `
                        <div class="row g-3 mb-4">
                            <div class="col-md-4">
                                <img src="${p.images?.[0] || 'hero1.jpeg'}" alt="${p.title}" class="w-100 rounded-3 border" style="object-fit: cover; max-height: 220px;" onerror="this.src='hero1.jpeg'">
                            </div>
                            <div class="col-md-8">
                                <h5 class="fw-bold mb-2">${p.title}</h5>
                                <div class="d-flex gap-2 flex-wrap mb-2">${statusBadge} ${stockBadge} ${p.isNewest ? '<span class="badge bg-primary-subtle text-primary">New Arrival</span>' : ''}</div>
                                <div class="text-secondary mb-2">${p.description || 'No description provided.'}</div>
                                <div class="row g-2 small">
                                    <div class="col-6"><span class="text-muted">Category:</span> <strong>${catText}</strong></div>
                                    <div class="col-6"><span class="text-muted">Price:</span> <strong>${formatAdminPrice(p.price)}</strong></div>
                                    <div class="col-6"><span class="text-muted">Material:</span> <strong>${p.material || '—'}</strong></div>
                                    <div class="col-6"><span class="text-muted">Dimensions:</span> <strong>${p.dimensions || '—'}</strong></div>
                                    <div class="col-6"><span class="text-muted">Color:</span> <strong>${p.color || '—'}</strong></div>
                                    <div class="col-6"><span class="text-muted">Rating:</span> <strong>${stats.avgRating || p.rating || 0} (${stats.reviewCount || 0} reviews)</strong></div>
                                </div>
                            </div>
                        </div>
                        <div class="row g-3">
                            <div class="col-md-6">
                                <h6 class="fw-bold mb-3"><i class="fa-solid fa-star me-2"></i>Recent Reviews</h6>
                                ${reviewsHtml}
                            </div>
                            <div class="col-md-6">
                                <h6 class="fw-bold mb-3"><i class="fa-solid fa-receipt me-2"></i>Recent Orders (${stats.totalOrders || 0} total)</h6>
                                ${ordersHtml}
                            </div>
                        </div>
                    `;
                })
                .catch((err) => {
                    console.error(err);
                    bodyEl.innerHTML = `<div class="alert alert-danger mb-0">Could not load product details.</div>`;
                });
        }

        // Convert file selection to Base64
        function convertImageToBase64(input) {
            const file = input.files[0];
            if (!file) return;

            if (file.size > 2 * 1024 * 1024) {
                notifyAdminWarning('File is too large! Choose an image under 2MB.');
                input.value = "";
                return;
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                tempBase64Image = e.target.result;
            };
            reader.readAsDataURL(file);
        }

        // Submit product addition/modification
        function handleProductFormSubmit(e) {
            e.preventDefault();

            const indexVal = document.getElementById('formProductId').value;
            const title = document.getElementById('formProductTitle').value.trim();
            const category = document.getElementById('formProductCategory').value;
            const materialType = document.getElementById('formProductMaterialType').value;
            const price = Number(document.getElementById('formProductPrice').value);
            const oldPriceVal = document.getElementById('formProductOldPrice').value;
            const oldPrice = oldPriceVal ? Number(oldPriceVal) : null;
            const color = document.getElementById('formProductColor').value.trim();
            const stockVal = Math.max(0, parseInt(document.getElementById('formProductStockVal').value, 10) || 0);
            const status = document.getElementById('formProductStatus').value;
            const isNewest = document.getElementById('formProductIsNewest').checked;
            const description = document.getElementById('formProductDescription').value.trim();
            const material = document.getElementById('formProductMaterialSpec').value.trim();
            const dimensions = document.getElementById('formProductDimensions').value.trim();
            const imageUrlInput = document.getElementById('formProductImageUrl').value.trim();

            // Set images array. Use the Base64 file if uploaded, else URL, else placeholder.
            let finalImage = "hero1.jpeg";
            if (tempBase64Image !== "") {
                finalImage = tempBase64Image;
            } else if (imageUrlInput !== "") {
                finalImage = imageUrlInput;
            } else if (indexVal !== "" && products[indexVal] && products[indexVal].images) {
                finalImage = products[indexVal].images[0];
            }

            // Capitalize label for visual aesthetic (e.g. Chair, Living Room)
            const categoryLabels = {
                'chair': 'Chair',
                'bedroom': 'Bedroom',
                'living-room': 'Living Room',
                'dining-room': 'Dining Room',
                'outdoor': 'Outdoor',
                'office': 'Office',
            };
            const label = categoryLabels[category] || category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

            const discount = (oldPrice && oldPrice > price) ?
                Math.round(((oldPrice - price) / oldPrice) * 100) + "% off" : "";

            const stock = stockVal > 0 ? 'in-stock' : 'out-of-stock';
            const availability = stockVal > 0 ? 'In Stock' : 'Out of Stock';

            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            const payload = {
                title,
                category,
                label,
                materialType,
                materialLabel: materialType.charAt(0).toUpperCase() + materialType.slice(1),
                material,
                dimensions,
                description,
                price,
                oldPrice,
                discount,
                stockVal,
                stock,
                color,
                isNewest,
                images: [finalImage, finalImage, finalImage, finalImage],
                status,
                availability
            };

            if (indexVal === "") {
                // ADD NEW PRODUCT (API POST)
                fetch(apiUrl('/api/products'), {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(payload)
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        showAdminNotification(`✅ Product '${title}' has been added successfully!`);
                        bootstrap.Modal.getInstance(document.getElementById('productFormModal')).hide();
                        switchTab('products');
                    } else {
                        notifyAdminError(data.message || 'Request failed.');
                    }
                })
                .catch(err => {
                    console.error(err);
                    notifyAdminError('Could not connect to the server. Try again.');
                });
            } else {
                // EDIT EXISTING PRODUCT (API PUT)
                const productId = products[indexVal].id;
                fetch(apiUrl(`/api/products/${productId}`), {
                    method: 'PUT',
                    headers: headers,
                    body: JSON.stringify(payload)
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        showAdminNotification(`✅ Product '${title}' has been updated successfully!`);
                        bootstrap.Modal.getInstance(document.getElementById('productFormModal')).hide();
                        switchTab('products');
                    } else {
                        notifyAdminError(data.message || 'Request failed.');
                    }
                })
                .catch(err => {
                    console.error(err);
                    notifyAdminError('Could not connect to the server. Try again.');
                });
            }
        }

        // Delete Product
        function deleteProduct(index) {
            const p = products[index];
            if (!p) return;

            if (confirm(`Are you sure you want to delete product '${p.title}'?`)) {
                const token = localStorage.getItem('token');
                fetch(apiUrl(`/api/products/${p.id}`), {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        showAdminNotification("Product deleted successfully.");
                        switchTab('products');
                    } else {
                        notifyAdminError(data.message || 'Request failed.');
                    }
                })
                .catch(err => {
                    console.error(err);
                    notifyAdminError('Could not connect to the server. Try again.');
                });
            }
        }

        // ==================== ORDER ACTIONS AND RENDER ====================
        // ==================== ORDER ACTIONS AND RENDER ====================
        let orderCurrentPage = 1;
        const orderPageSize = 7;
        let currentFilteredOrders = [];
        let orderStats = null;

        function parseOrderDate(order) {
            if (order.createdAt) {
                return new Date(order.createdAt);
            }
            if (order.date) {
                const parsed = new Date(order.date);
                if (!Number.isNaN(parsed.getTime())) return parsed;
            }
            return null;
        }

        function isOrderInDateRange(order, dateFilter) {
            if (dateFilter === 'all') return true;
            const orderDate = parseOrderDate(order);
            if (!orderDate) return dateFilter === 'all';

            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const startOfYesterday = new Date(startOfToday);
            startOfYesterday.setDate(startOfYesterday.getDate() - 1);
            const startOfWeek = new Date(startOfToday);
            startOfWeek.setDate(startOfWeek.getDate() - 7);

            if (dateFilter === 'today') {
                return orderDate >= startOfToday;
            }
            if (dateFilter === 'yesterday') {
                return orderDate >= startOfYesterday && orderDate < startOfToday;
            }
            if (dateFilter === 'week') {
                return orderDate >= startOfWeek;
            }
            return true;
        }

        async function loadOrderStats() {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const res = await fetch(apiUrl('/api/orders/stats'), {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (data.success) {
                    orderStats = data.stats;
                    renderOrderStatistics(currentFilteredOrders.length ? currentFilteredOrders : orders);
                }
            } catch (err) {
                console.warn('Could not load order stats:', err);
            }
        }

        function getOrderStatusLabel(order) {
            if (order.currentStep === 0 || order.status === 'Cancelled') return 'Cancelled';
            if (order.currentStep === 5 || order.status === 'Delivered') return 'Delivered';
            if (order.currentStep === 4 || order.status === 'Shipped') return 'Shipped';
            if (order.currentStep === 2 || order.currentStep === 3 || order.status === 'Processing') return 'Processing';
            return 'Pending';
        }

        function getOrderPaymentLabel(order) {
            if (!order.payment) return 'Pending';
            const p = order.payment.toLowerCase();
            if (p === 'paid') return 'Paid';
            if (p === 'failed') return 'Failed';
            return 'Pending';
        }

        function onOrderFilterChange() {
            orderCurrentPage = 1;
            runOrderFiltering();
        }

        function runOrderFiltering() {
            const queryEl = document.getElementById('orderSearchQuery');
            const statusEl = document.getElementById('orderFilterStatus');
            const paymentEl = document.getElementById('orderFilterPayment');
            const dateEl = document.getElementById('orderFilterDate');

            const query = queryEl ? queryEl.value.toLowerCase().trim() : '';
            const statusFilter = statusEl ? statusEl.value : 'all';
            const paymentFilter = paymentEl ? paymentEl.value : 'all';
            const dateFilter = dateEl ? dateEl.value : 'all';

            currentFilteredOrders = orders.filter(order => {
                const orderId = order.id.toLowerCase();
                const customerName = order.customer.toLowerCase();
                const phone = (order.phone || '').toLowerCase();
                const orderStatus = getOrderStatusLabel(order).toLowerCase();
                const orderPayment = getOrderPaymentLabel(order).toLowerCase();

                const matchesSearch = orderId.includes(query) || customerName.includes(query) || phone.includes(query);
                const matchesStatus = statusFilter === 'all' || orderStatus === statusFilter.toLowerCase();
                const matchesPayment = paymentFilter === 'all' || orderPayment === paymentFilter.toLowerCase();

                let matchesDate = isOrderInDateRange(order, dateFilter);

                return matchesSearch && matchesStatus && matchesPayment && matchesDate;
            });

            renderOrdersTable(currentFilteredOrders);
        }

        function renderOrdersTable(list) {
            // First, calculate stats
            renderOrderStatistics(list);

            const tbody = document.getElementById('ordersTableBody');
            if (!tbody) return;
            tbody.innerHTML = "";

            const totalOrders = list.length;
            const totalPages = Math.ceil(totalOrders / orderPageSize) || 1;
            if (orderCurrentPage > totalPages) orderCurrentPage = totalPages;

            const startIdx = (orderCurrentPage - 1) * orderPageSize;
            const endIdx = Math.min(startIdx + orderPageSize, totalOrders);

            const paginatedList = list.slice(startIdx, endIdx);

            if (paginatedList.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No matching orders found.</td></tr>`;
                const pagInfo = document.getElementById('orderPaginationInfo');
                if (pagInfo) pagInfo.innerText = "Showing 0 to 0 of 0 orders";
                renderOrderPagination(1, 1);
                return;
            }

            paginatedList.forEach(order => {
                const status = getOrderStatusLabel(order);
                const payment = getOrderPaymentLabel(order);
                
                let statusBadgeClass = 'badge-status-pending';
                if (status === 'Delivered') statusBadgeClass = 'badge-status-delivered';
                else if (status === 'Shipped') statusBadgeClass = 'badge-status-shipped';
                else if (status === 'Cancelled') statusBadgeClass = 'badge-status-cancelled';
                else if (status === 'Processing') statusBadgeClass = 'badge-status-processing';

                let paymentBadgeClass = 'badge-payment-pending';
                if (payment === 'Paid') paymentBadgeClass = 'badge-payment-paid';
                else if (payment === 'Failed') paymentBadgeClass = 'badge-payment-failed';

                const index = orders.findIndex(o => o.id === order.id);

                tbody.innerHTML += `
                    <tr>
                        <td class="fw-bold text-success font-monospace" style="font-size: 0.84rem;">${order.id}</td>
                        <td class="fw-semibold text-dark" style="font-size: 0.84rem;">${order.customer}</td>
                        <td>
                            <span class="badge ${statusBadgeClass} border-0 px-2 py-1 fw-bold" style="font-size: 0.72rem; border-radius: 6px;">${status}</span>
                        </td>
                        <td>
                            <span class="badge ${paymentBadgeClass} border-0 px-2 py-1 fw-bold" style="font-size: 0.72rem; border-radius: 6px;">${payment}</span>
                        </td>
                        <td class="fw-bold text-dark" style="font-size: 0.84rem;">${order.amount}</td>
                        <td class="text-secondary" style="font-size: 0.84rem;">${order.date || 'May 22, 2026'}</td>
                        <td>
                            <button class="btn-table-action view" onclick="openOrderEditModal(${index})" title="View Details" style="background: none; border: none; padding: 0; color: #4B5563; font-size: 0.95rem;">
                                <i class="fa-regular fa-eye"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });

            const pagInfo = document.getElementById('orderPaginationInfo');
            if (pagInfo) {
                pagInfo.innerText = `Showing ${startIdx + 1} to ${endIdx} of ${totalOrders} orders`;
            }

            renderOrderPagination(orderCurrentPage, totalPages);
        }

        function renderOrderPagination(currentPage, totalPages) {
            const paginationUl = document.getElementById('orderPaginationButtons');
            if (!paginationUl) return;
            paginationUl.innerHTML = "";

            // Previous Button
            const prevDisabled = currentPage === 1 ? 'disabled' : '';
            paginationUl.innerHTML += `
                <li class="page-item ${prevDisabled}">
                    <a class="page-link" onclick="setOrderPage(${currentPage - 1})" aria-label="Previous">
                        <span aria-hidden="true">&laquo;</span>
                    </a>
                </li>
            `;

            // Page Numbers
            for (let i = 1; i <= totalPages; i++) {
                const activeClass = currentPage === i ? 'active' : '';
                paginationUl.innerHTML += `
                    <li class="page-item ${activeClass}">
                        <a class="page-link" onclick="setOrderPage(${i})">${i}</a>
                    </li>
                `;
            }

            // Next Button
            const nextDisabled = currentPage === totalPages ? 'disabled' : '';
            paginationUl.innerHTML += `
                <li class="page-item ${nextDisabled}">
                    <a class="page-link" onclick="setOrderPage(${currentPage + 1})" aria-label="Next">
                        <span aria-hidden="true">&raquo;</span>
                    </a>
                </li>
            `;
        }

        function setOrderPage(page) {
            orderCurrentPage = page;
            renderOrdersTable(currentFilteredOrders);
        }

        function renderOrderStatistics(list) {
            applyDashboardStatsFromApi();
        }

        function exportOrdersToCSV() {
            const dataToExport = currentFilteredOrders.length > 0 ? currentFilteredOrders : orders;
            
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Order ID,Customer,Status,Payment,Amount,Date\n";
            
            dataToExport.forEach(order => {
                const orderId = order.id;
                const customer = order.customer.replace(/"/g, '""');
                const status = getOrderStatusLabel(order);
                const payment = getOrderPaymentLabel(order);
                const amount = order.amount.replace(/[$,]/g, '');
                const date = order.date || 'May 22, 2026';
                
                csvContent += `"${orderId}","${customer}","${status}","${payment}","${amount}","${date}"\n`;
            });
            
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `MMF_Orders_Export_${new Date().toISOString().slice(0,10)}.csv`);
            document.body.appendChild(link);
            
            link.click();
            document.body.removeChild(link);
            showAdminNotification("✅ Orders exported successfully as CSV!");
        }

        // Open Order status / detail Modal
        function openOrderEditModal(index) {
            const order = orders[index];
            if (!order) return;

            document.getElementById('formOrderId').value = index;
            document.getElementById('orderModalName').innerText = order.customer;
            document.getElementById('orderModalPhone').innerText = order.phone || '---';
            document.getElementById('orderModalAddress').innerText = order.address || 'Mogadishu Delivery Address';
            document.getElementById('orderModalDate').innerText = order.date || '---';
            const deliverySlot = [order.deliveryDate, order.deliveryTime].filter(Boolean).join(' at ');
            const deliveryEl = document.getElementById('orderModalDelivery');
            if (deliveryEl) deliveryEl.innerText = deliverySlot || 'Not specified';
            document.getElementById('orderModalTotal').innerText = order.amount;

            const breakdownEl = document.getElementById('orderModalBreakdown');
            if (breakdownEl) {
                breakdownEl.innerHTML = `<span class="text-muted small">Loading breakdown...</span>`;
            }
            renderOrderActivityTimeline([]);

            // Render ordered items thumbnails
            const itemsBox = document.getElementById('orderModalItemsList');
            itemsBox.innerHTML = "";

            if (order.items && order.items.length > 0) {
                order.items.forEach(item => {
                    itemsBox.innerHTML += `
                        <div class="order-item-summary-card">
                            <img src="${item.image ? item.image : 'hero1.jpeg'}" onerror="this.src='hero1.jpeg'">
                            <div class="order-item-summary-info">
                                <span class="order-item-summary-title">${item.title}</span>
                                <span class="order-item-summary-meta d-block">${item.category || 'Furniture'} • Qty: ${item.quantity}</span>
                            </div>
                            <span class="order-item-summary-price">$${Number(item.price * item.quantity).toLocaleString()}.00</span>
                        </div>
                    `;
                });
            } else {
                // If it was a default placeholder order with no dynamic items list, render summary line
                itemsBox.innerHTML = `
                    <div class="order-item-summary-card">
                        <div class="order-item-summary-info">
                            <span class="order-item-summary-title">${order.product}</span>
                            <span class="order-item-summary-meta d-block">Default catalog order description</span>
                        </div>
                        <span class="order-item-summary-price">${order.amount}</span>
                    </div>
                `;
            }

            // Fill editable fields
            document.getElementById('formOrderPayment').value = order.paymentType === 'paid' ? 'Paid' : 'Pending';
            document.getElementById('formOrderDeliveryStep').value = order.currentStep || 1;
            document.getElementById('formOrderEstimate').value = order.estimate === 'Waiting for order confirmation' ? '' : (order.estimate || '');

            loadApprovedDrivers().then(() => {
                populateOrderDriverSelect(order.assignedDriverId || '');
            });

            const modal = new bootstrap.Modal(document.getElementById('orderEditModal'));
            modal.show();

            const token = localStorage.getItem('token');
            if (token) {
                fetch(apiUrl(`/api/orders/${encodeURIComponent(order.id)}/details`), {
                    headers: { Authorization: `Bearer ${token}` },
                })
                    .then((res) => res.json())
                    .then((data) => {
                        if (!data.success) return;

                        renderOrderActivityTimeline(data.activities || []);

                        const breakdown = data.breakdown || {};
                        if (breakdownEl) {
                            breakdownEl.innerHTML = `
                                <div class="d-flex justify-content-between mb-1"><span class="text-secondary">Items</span><span class="fw-semibold">${breakdown.itemCount || 0}</span></div>
                                <div class="d-flex justify-content-between mb-1"><span class="text-secondary">Subtotal</span><span class="fw-semibold">$${Number(breakdown.subtotal || 0).toFixed(3)}</span></div>
                                <div class="d-flex justify-content-between mb-1"><span class="text-secondary">Delivery</span><span class="fw-semibold">$${Number(breakdown.deliveryFee || 0).toFixed(3)}</span></div>
                                <div class="d-flex justify-content-between mb-1"><span class="text-secondary">Discount</span><span class="fw-semibold">-$${Number(breakdown.discount || 0).toFixed(3)}</span></div>
                                ${breakdown.couponCode ? `<div class="d-flex justify-content-between mb-1"><span class="text-secondary">Coupon</span><span class="fw-semibold">${breakdown.couponCode}</span></div>` : ''}
                                <div class="d-flex justify-content-between pt-2 border-top mt-2"><span class="text-dark fw-bold">Grand Total</span><span class="fw-bold text-success">$${Number(breakdown.grandTotal || 0).toFixed(3)}</span></div>
                            `;
                        }

                        if (data.transactions?.length) {
                            const tx = data.transactions[0];
                            const txEl = document.getElementById('orderModalPaymentRef');
                            if (txEl) {
                                txEl.innerText = tx.referenceId || tx.transactionId || '—';
                            }
                        }
                    })
                    .catch((err) => console.warn('Order details fetch failed:', err));
            }
        }

        // Submit order update
        function handleOrderEditSubmit(e) {
            e.preventDefault();

            const indexVal = document.getElementById('formOrderId').value;
            const paymentVal = document.getElementById('formOrderPayment').value;
            const stepVal = Number(document.getElementById('formOrderDeliveryStep').value);
            const assignedDriverId = document.getElementById('formOrderAssignDriver')?.value || '';
            const estimateVal = document.getElementById('formOrderEstimate').value.trim();

            const order = orders[indexVal];
            if (order) {
                let finalEstimate = estimateVal;
                if (estimateVal === "") {
                    const stepEstimates = [
                        "Waiting for order confirmation",
                        "Payment verified. Preparing order",
                        "Preparing order for dispatch",
                        "Out for delivery via driver",
                        "Delivered successfully"
                    ];
                    finalEstimate = stepEstimates[stepVal - 1] || "Processing";
                }

                const payload = {
                    payment: paymentVal,
                    paymentType: paymentVal === 'Paid' ? 'paid' : 'pending',
                    currentStep: stepVal,
                    estimate: finalEstimate
                };

                const token = localStorage.getItem('token');
                const orderIdEncoded = encodeURIComponent(order.id);

                const assignThenUpdate = assignedDriverId
                    ? fetch(apiUrl(`/api/orders/${orderIdEncoded}/assign`), {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ assignedDriverId })
                    }).then(res => res.json())
                    : Promise.resolve({ success: true });

                assignThenUpdate
                .then((assignData) => {
                    if (assignedDriverId && !assignData.success) {
                        showAdminNotification(`❌ ${assignData.message || 'Could not assign driver.'}`, 'danger');
                        return null;
                    }
                    return fetch(apiUrl(`/api/orders/${orderIdEncoded}`), {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(payload)
                    }).then(res => res.json());
                })
                .then(data => {
                    if (!data) return;
                    if (data.success) {
                        showAdminNotification(`✅ Order '${order.id}' status updated successfully!`);
                        bootstrap.Modal.getInstance(document.getElementById('orderEditModal')).hide();
                        loadedScopes.delete('orders');
                        loadedScopes.delete('recentOrders');
                        switchTab('orders');
                    } else {
                        showAdminNotification(`❌ ${data.message || 'Update failed.'}`, 'danger');
                    }
                })
                .catch(err => {
                    console.error(err);
                    showAdminNotification('❌ An error occurred while communicating with the server!', 'danger');
                });
            }
        }

        // ==================== CUSTOMER ACTIONS AND RENDER ====================
        function formatLastLogin(value) {
            if (!value) return 'Never';
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return 'Never';
            return date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
            });
        }

        function formatActivityLabel(action) {
            const labels = {
                register: 'Registered account',
                login: 'Signed in',
                profile_update: 'Updated profile',
                password_change: 'Changed password',
                order_placed: 'Order placed',
                role_changed: 'Role updated',
                account_activated: 'Account activated',
                account_deactivated: 'Account deactivated',
                status_changed: 'Status updated',
                payment_updated: 'Payment updated',
                driver_assigned: 'Driver assigned',
                driver_reassigned: 'Driver reassigned',
                order_cancelled: 'Order cancelled',
                estimate_updated: 'Delivery estimate updated',
            };
            return labels[action] || action;
        }

        function formatActivityIcon(action) {
            const icons = {
                register: 'fa-user-plus',
                login: 'fa-right-to-bracket',
                profile_update: 'fa-user-pen',
                password_change: 'fa-key',
                order_placed: 'fa-bag-shopping',
                role_changed: 'fa-user-gear',
                account_activated: 'fa-user-check',
                account_deactivated: 'fa-user-slash',
                status_changed: 'fa-truck-fast',
                payment_updated: 'fa-credit-card',
                driver_assigned: 'fa-id-card',
                driver_reassigned: 'fa-arrows-rotate',
                order_cancelled: 'fa-ban',
                estimate_updated: 'fa-clock',
            };
            return icons[action] || 'fa-circle-info';
        }

        function renderOrderActivityTimeline(activities) {
            const box = document.getElementById('orderModalActivity');
            if (!box) return;

            if (!activities || activities.length === 0) {
                box.innerHTML = `<p class="text-muted mb-0 small">No activity recorded yet for this order.</p>`;
                return;
            }

            box.innerHTML = activities.map((item) => {
                const when = formatLastLogin(item.createdAt);
                return `
                    <div class="d-flex gap-3 align-items-start mb-3 pb-3 border-bottom">
                        <div class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width: 32px; height: 32px; background: #E8F5F3; color: #073D35;">
                            <i class="fa-solid ${formatActivityIcon(item.action)}" style="font-size: 0.75rem;"></i>
                        </div>
                        <div>
                            <div class="fw-semibold text-dark" style="font-size: 0.84rem;">${formatActivityLabel(item.action)}</div>
                            <div class="text-secondary" style="font-size: 0.78rem;">${item.description || ''}</div>
                            <div class="text-muted" style="font-size: 0.72rem;">${when}</div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function renderCustomersTable(list) {
            const tbody = document.getElementById('customersTableBody');
            tbody.innerHTML = "";

            // Exclude admin from table so they don't delete themselves
            const customersOnly = list.filter(u => u.email.toLowerCase() !== 'admin@gmail.com');

            if (customersOnly.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">No customer accounts registered yet.</td></tr>`;
                return;
            }

            // Sort alphabetically (A-Z) by Name
            customersOnly.sort((a, b) => {
                const nameA = ((a.firstName || '') + ' ' + (a.lastName || '')).trim().toLowerCase();
                const nameB = ((b.firstName || '') + ' ' + (b.lastName || '')).trim().toLowerCase();
                return nameA.localeCompare(nameB);
            });

            customersOnly.forEach(customer => {
                const index = users.findIndex(u => u.id === customer.id);
                const fullName = `${customer.firstName} ${customer.lastName}`;
                const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                
                // Lookup or generate avatar photo to match mockup exactly
                let avatarHTML = '';
                if (fullName.toLowerCase().includes('abdi hassan')) {
                    avatarHTML = `<img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150" alt="${fullName}" class="rounded-circle" style="width: 36px; height: 36px; object-fit: cover;">`;
                } else if (fullName.toLowerCase().includes('hodan ali')) {
                    avatarHTML = `<img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" alt="${fullName}" class="rounded-circle" style="width: 36px; height: 36px; object-fit: cover;">`;
                } else if (fullName.toLowerCase().includes('ayan abdullahi')) {
                    avatarHTML = `<img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150" alt="${fullName}" class="rounded-circle" style="width: 36px; height: 36px; object-fit: cover;">`;
                } else if (fullName.toLowerCase().includes('mustafa omar')) {
                    avatarHTML = `<img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" alt="${fullName}" class="rounded-circle" style="width: 36px; height: 36px; object-fit: cover;">`;
                } else if (fullName.toLowerCase().includes('mohamed yusuf')) {
                    avatarHTML = `<img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150" alt="${fullName}" class="rounded-circle" style="width: 36px; height: 36px; object-fit: cover;">`;
                } else if (fullName.toLowerCase().includes('omar mohamed')) {
                    avatarHTML = `<img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150" alt="${fullName}" class="rounded-circle" style="width: 36px; height: 36px; object-fit: cover;">`;
                } else {
                    avatarHTML = `<div class="initials-avatar fw-bold text-white d-flex align-items-center justify-content-center" style="width: 36px; height: 36px; border-radius: 50%; font-size: 0.76rem; background-color: #073D35;">${initials}</div>`;
                }

                // Status from API
                const isActive = customer.isActive !== false;
                const statusBadge = isActive
                    ? `<span class="badge bg-success-subtle text-success border-0 px-2 py-1 fw-bold" style="font-size: 0.72rem; border-radius: 6px;">Active</span>`
                    : `<span class="badge bg-danger-subtle text-danger border-0 px-2 py-1 fw-bold" style="font-size: 0.72rem; border-radius: 6px;">Inactive</span>`;

                const roleLabels = { user: 'Customer', delivery: 'Driver', admin: 'Admin' };
                const roleLabel = roleLabels[customer.role] || 'Customer';

                tbody.innerHTML += `
                    <tr>
                        <td>
                            <div class="d-flex align-items-center gap-2">
                                ${avatarHTML}
                                <span class="fw-bold text-dark" style="font-size: 0.84rem;">${fullName}</span>
                            </div>
                        </td>
                        <td>
                            <div class="fw-semibold text-dark" style="font-size: 0.84rem;">${customer.email}</div>
                            <div class="text-secondary" style="font-size: 0.74rem;">${customer.phone || '---'}</div>
                        </td>
                        <td class="text-secondary" style="font-size: 0.84rem;">${roleLabel}</td>
                        <td>${statusBadge}</td>
                        <td class="text-secondary" style="font-size: 0.84rem;">${customer.orderCount || 0}</td>
                        <td class="text-secondary" style="font-size: 0.84rem;">${formatLastLogin(customer.lastLoginAt)}</td>
                        <td class="text-secondary" style="font-size: 0.84rem;">${customer.joinedDate || 'May 20, 2026'}</td>
                        <td>
                            <div class="d-flex gap-2">
                                <button class="btn-table-action view" onclick="openViewUserModal('${customer.id}')" title="View Activity" style="background: none; border: none; padding: 0; color: #073D35; font-size: 0.95rem;">
                                    <i class="fa-regular fa-eye"></i>
                                </button>
                                <button class="btn-table-action view" onclick="openEditUserModal(${index})" title="Edit Account" style="background: none; border: none; padding: 0; color: #4B5563; font-size: 0.95rem;">
                                    <i class="fa-regular fa-pen-to-square"></i>
                                </button>
                                <button class="btn-table-action view" onclick="toggleUserActive(${index})" title="${isActive ? 'Deactivate' : 'Activate'}" style="background: none; border: none; padding: 0; color: ${isActive ? '#D97706' : '#059669'}; font-size: 0.95rem;">
                                    <i class="fa-solid ${isActive ? 'fa-user-slash' : 'fa-user-check'}"></i>
                                </button>
                                <button class="btn-table-action delete" onclick="deleteCustomer(${index})" title="Delete Account" style="background: none; border: none; padding: 0; color: #DC2626; font-size: 0.95rem;">
                                    <i class="fa-regular fa-trash-can"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
        }

        function filterCustomersTable() {
            const query = document.getElementById('customerSearchQuery').value.toLowerCase().trim();
            const filtered = users.filter(u => {
                return (u.firstName + " " + u.lastName).toLowerCase().includes(query) ||
                    u.email.toLowerCase().includes(query) ||
                    (u.phone && u.phone.includes(query)) ||
                    String(u.id).includes(query);
            });
            renderCustomersTable(filtered);
        }

        // Delete Customer account
        function deleteCustomer(index) {
            const customer = users[index];
            if (!customer) return;

            if (confirm(`Are you sure you want to delete customer account '${customer.firstName} ${customer.lastName}'?`)) {
                const token = localStorage.getItem('token');
                fetch(apiUrl(`/api/auth/users/${customer.id}`), {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        showAdminNotification("Customer account deleted successfully.");
                        switchTab('users');
                    } else {
                        notifyAdminError(data.message || 'Request failed.');
                    }
                })
                .catch(err => {
                    console.error(err);
                    notifyAdminError('Could not connect to the server. Try again.');
                });
            }
        }

        function openViewUserModal(userId) {
            const modalEl = document.getElementById('userDetailsModal');
            const bodyEl = document.getElementById('userDetailsModalBody');
            const titleEl = document.getElementById('userDetailsModalTitle');
            if (!modalEl || !bodyEl) return;

            bodyEl.innerHTML = `<div class="text-center text-muted py-4"><i class="fa-solid fa-spinner fa-spin me-2"></i>Loading customer activity...</div>`;
            const modal = new bootstrap.Modal(modalEl);
            modal.show();

            const token = localStorage.getItem('token');
            fetch(apiUrl(`/api/auth/users/${userId}/details`), {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => res.json())
                .then((data) => {
                    if (!data.success) {
                        bodyEl.innerHTML = `<div class="alert alert-danger mb-0">${data.message || 'Failed to load user details.'}</div>`;
                        return;
                    }

                    const user = data.user;
                    const stats = data.stats || {};
                    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                    titleEl.innerText = `Customer Activity — ${fullName}`;

                    const roleLabels = { user: 'Customer', delivery: 'Driver', admin: 'Admin' };
                    const statusBadge = user.isActive !== false
                        ? `<span class="badge bg-success-subtle text-success border-0 px-2 py-1 fw-bold">Active</span>`
                        : `<span class="badge bg-danger-subtle text-danger border-0 px-2 py-1 fw-bold">Inactive</span>`;

                    const activitiesHtml = (data.activities || []).length
                        ? data.activities.map((item) => {
                            const when = formatLastLogin(item.createdAt);
                            return `
                                <div class="d-flex gap-3 align-items-start mb-3 pb-3 border-bottom">
                                    <div class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width: 36px; height: 36px; background: #E8F5F3; color: #073D35;">
                                        <i class="fa-solid ${formatActivityIcon(item.action)}"></i>
                                    </div>
                                    <div>
                                        <div class="fw-semibold text-dark" style="font-size: 0.88rem;">${formatActivityLabel(item.action)}</div>
                                        <div class="text-secondary" style="font-size: 0.8rem;">${item.description || ''}</div>
                                        <div class="text-muted" style="font-size: 0.74rem;">${when}</div>
                                    </div>
                                </div>
                            `;
                        }).join('')
                        : `<p class="text-muted mb-0">No activity recorded yet for this customer.</p>`;

                    const ordersHtml = (data.recentOrders || []).length
                        ? `<div class="table-responsive"><table class="table table-sm align-middle mb-0"><thead><tr><th>Order</th><th>Product</th><th>Amount</th><th>Status</th></tr></thead><tbody>${data.recentOrders.map((order) => `
                            <tr>
                                <td class="fw-semibold">${order.id}</td>
                                <td>${order.product || '—'}</td>
                                <td>$${Number(order.amount || 0).toFixed(3)}</td>
                                <td><span class="badge bg-light text-dark border">${order.status || '—'}</span></td>
                            </tr>
                        `).join('')}</tbody></table></div>`
                        : `<p class="text-muted mb-0">No orders placed yet.</p>`;

                    bodyEl.innerHTML = `
                        <div class="row g-3 mb-4">
                            <div class="col-md-6">
                                <div class="p-3 rounded-3 border h-100">
                                    <div class="text-uppercase text-muted fw-bold mb-2" style="font-size: 0.72rem; letter-spacing: 0.04em;">Profile</div>
                                    <div class="fw-bold text-dark mb-1">${fullName}</div>
                                    <div class="text-secondary" style="font-size: 0.84rem;">${user.email}</div>
                                    <div class="text-secondary" style="font-size: 0.84rem;">${user.phone || '—'}</div>
                                    <div class="mt-2 d-flex gap-2 flex-wrap">
                                        <span class="badge bg-light text-dark border">${roleLabels[user.role] || user.role}</span>
                                        ${statusBadge}
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="p-3 rounded-3 border h-100">
                                    <div class="text-uppercase text-muted fw-bold mb-2" style="font-size: 0.72rem; letter-spacing: 0.04em;">Stats</div>
                                    <div class="d-flex justify-content-between mb-2"><span class="text-secondary">Total Orders</span><span class="fw-bold">${stats.totalOrders || 0}</span></div>
                                    <div class="d-flex justify-content-between mb-2"><span class="text-secondary">Total Spent</span><span class="fw-bold">$${Number(stats.totalSpent || 0).toFixed(3)}</span></div>
                                    <div class="d-flex justify-content-between mb-2"><span class="text-secondary">Last Login</span><span class="fw-semibold">${formatLastLogin(user.lastLoginAt)}</span></div>
                                    <div class="d-flex justify-content-between"><span class="text-secondary">Joined</span><span class="fw-semibold">${user.joinedDate || '—'}</span></div>
                                </div>
                            </div>
                        </div>
                        <div class="mb-4">
                            <h6 class="fw-bold mb-3"><i class="fa-solid fa-clock-rotate-left me-2"></i>Recent Activity</h6>
                            ${activitiesHtml}
                        </div>
                        <div>
                            <h6 class="fw-bold mb-3"><i class="fa-solid fa-receipt me-2"></i>Recent Orders</h6>
                            ${ordersHtml}
                        </div>
                    `;
                })
                .catch((err) => {
                    console.error(err);
                    bodyEl.innerHTML = `<div class="alert alert-danger mb-0">An error occurred while loading customer details.</div>`;
                });
        }

        function openEditUserModal(index) {
            const customer = users[index];
            if (!customer) return;

            document.getElementById('formUserId').value = customer.id;
            document.getElementById('formUserFirstName').value = customer.firstName || '';
            document.getElementById('formUserLastName').value = customer.lastName || '';
            document.getElementById('formUserEmail').value = customer.email || '';
            document.getElementById('formUserPhone').value = customer.phone || '';
            document.getElementById('formUserRole').value = customer.role || 'user';
            document.getElementById('formUserStatus').value = customer.isActive !== false ? 'true' : 'false';
            document.getElementById('userModalTitle').innerText = `Edit User: ${customer.firstName} ${customer.lastName || ''}`.trim();

            const modal = new bootstrap.Modal(document.getElementById('userEditModal'));
            modal.show();
        }

        function handleUserEditSubmit(e) {
            e.preventDefault();

            const userId = document.getElementById('formUserId').value;
            const payload = {
                firstName: document.getElementById('formUserFirstName').value.trim(),
                lastName: document.getElementById('formUserLastName').value.trim(),
                email: document.getElementById('formUserEmail').value.trim(),
                phone: document.getElementById('formUserPhone').value.trim(),
                role: document.getElementById('formUserRole').value,
                isActive: document.getElementById('formUserStatus').value === 'true',
            };

            const token = localStorage.getItem('token');
            fetch(apiUrl(`/api/auth/users/${userId}`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showAdminNotification('✅ User account updated successfully!');
                    bootstrap.Modal.getInstance(document.getElementById('userEditModal')).hide();
                    switchTab('users');
                } else {
                    notifyAdminError(data.message || 'Request failed.');
                }
            })
            .catch(err => {
                console.error(err);
                notifyAdminError('Could not connect to the server. Try again.');
            });
        }

        function toggleUserActive(index) {
            const customer = users[index];
            if (!customer) return;

            const nextActive = customer.isActive === false;
            const actionLabel = nextActive ? 'activate' : 'deactivate';
            if (!confirm(`Are you sure you want to ${actionLabel} '${customer.firstName} ${customer.lastName || ''}'?`)) return;

            const token = localStorage.getItem('token');
            fetch(apiUrl(`/api/auth/users/${customer.id}`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isActive: nextActive })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showAdminNotification(`✅ User account ${nextActive ? 'activated' : 'deactivated'} successfully.`);
                    switchTab('users');
                } else {
                    notifyAdminError(data.message || 'Request failed.');
                }
            })
            .catch(err => {
                console.error(err);
                notifyAdminError('Could not connect to the server. Try again.');
            });
        }

        // ==================== SETTINGS ACTIONS ====================
        function loadSettingsTab() {
            const token = localStorage.getItem('token');
            fetch(apiUrl('/api/cms'))
                .then(res => res.json())
                .then(data => {
                    const fees = data.cms?.deliveryFees || [];
                    const feeMap = {};
                    fees.forEach(entry => { feeMap[entry.district] = entry.fee; });

                    document.getElementById('deliveryFeeHodan').value = feeMap.Hodan ?? localStorage.getItem('deliveryFee_Hodan') ?? 0.001;
                    document.getElementById('deliveryFeeWadajir').value = feeMap.Wadajir ?? localStorage.getItem('deliveryFee_Wadajir') ?? 0.001;
                    document.getElementById('deliveryFeeKaraan').value = feeMap.Karaan ?? localStorage.getItem('deliveryFee_Karaan') ?? 0.002;
                    document.getElementById('deliveryFeeHamarweyne').value = feeMap.Hamarweyne ?? localStorage.getItem('deliveryFee_Hamarweyne') ?? 0.001;
                })
                .catch(() => {
                    document.getElementById('deliveryFeeHodan').value = localStorage.getItem('deliveryFee_Hodan') || 0.001;
                    document.getElementById('deliveryFeeWadajir').value = localStorage.getItem('deliveryFee_Wadajir') || 0.001;
                    document.getElementById('deliveryFeeKaraan').value = localStorage.getItem('deliveryFee_Karaan') || 0.002;
                    document.getElementById('deliveryFeeHamarweyne').value = localStorage.getItem('deliveryFee_Hamarweyne') || 0.001;
                });

            // Diagnostics — API connection status updated via dashboard stats
            const apiBadge = document.getElementById('apiConnectionBadge');
            if (apiBadge && !apiBadge.textContent.includes('open tickets')) {
                apiBadge.innerText = 'Connected via REST API';
            }
        }

        function saveSettings() {
            const feeHodan = document.getElementById('deliveryFeeHodan').value;
            const feeWadajir = document.getElementById('deliveryFeeWadajir').value;
            const feeKaraan = document.getElementById('deliveryFeeKaraan').value;
            const feeHamarweyne = document.getElementById('deliveryFeeHamarweyne').value;

            localStorage.setItem('deliveryFee_Hodan', feeHodan);
            localStorage.setItem('deliveryFee_Wadajir', feeWadajir);
            localStorage.setItem('deliveryFee_Karaan', feeKaraan);
            localStorage.setItem('deliveryFee_Hamarweyne', feeHamarweyne);

            const deliveryFees = [
                { district: 'Hodan', fee: Number(feeHodan) },
                { district: 'Wadajir', fee: Number(feeWadajir) },
                { district: 'Karaan', fee: Number(feeKaraan) },
                { district: 'Hamarweyne', fee: Number(feeHamarweyne) },
                { district: 'Dayniile', fee: Number(feeKaraan) },
                { district: 'Yaqshid', fee: Number(feeHodan) },
            ];

            const token = localStorage.getItem('token');
            fetch(apiUrl('/api/cms'), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ deliveryFees })
            })
            .then(res => res.json())
            .then(data => {
                if (!data.success) {
                    notifyAdminError(data.message || 'Could not save delivery fees.');
                } else {
                    window.dispatchEvent(new Event('delivery-fees-updated'));
                }
            })
            .catch(err => console.error('CMS delivery fee save failed:', err));

            const isStoreActive = document.getElementById('settingStoreActive').checked;
            document.getElementById('storeStatusLabel').innerText = isStoreActive ? "Store Open & Accepting Orders" : "Store Closed (Maintenance Mode)";
            document.getElementById('storeStatusLabel').className = isStoreActive ? "form-check-label ms-2 fw-bold text-success" : "form-check-label ms-2 fw-bold text-danger";

            showAdminNotification("Configuration parameters updated successfully.");
        }

        // Reset System Data
        function resetSystemData() {
            if (confirm("Clear browser cache only? MongoDB data will NOT be deleted.")) {
                localStorage.removeItem('products');
                localStorage.removeItem('orders');
                localStorage.removeItem('users');
                localStorage.removeItem('productReviews');

                showAdminNotification("Browser cache cleared. Reloading admin panel...");
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        }


        // ==================== INVENTORY & STOCK CONTROL ====================
        function renderStockTable() {
            const tbody = document.getElementById('stockTableBody');
            if (!tbody) return;
            tbody.innerHTML = '';
            
            const query = document.getElementById('stockSearchQuery') ? document.getElementById('stockSearchQuery').value.toLowerCase().trim() : '';
            const filteredProducts = products.filter(p => p.title.toLowerCase().includes(query) || p.category.toLowerCase().includes(query));
            
            if (filteredProducts.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No matching inventory items found.</td></tr>`;
                return;
            }
            
            filteredProducts.forEach(product => {
                const stockVal = typeof product.stockVal === 'number' ? product.stockVal : (product.stock === 'in-stock' ? 12 : 0);
                
                let statusBadge = '<span class="badge-status instock">In Stock</span>';
                if (stockVal === 0) {
                    statusBadge = '<span class="badge-status outofstock">Out of Stock</span>';
                } else if (stockVal <= 5) {
                    statusBadge = '<span class="badge-status lowstock" style="background: rgba(216,161,40,0.1); color: var(--gold);">Low Stock</span>';
                }
                
                const index = products.findIndex(p => p.id === product.id);
                
                tbody.innerHTML += `
                    <tr>
                        <td>
                            <img src="${product.images ? product.images[0] : ''}" alt="${product.title}" style="width: 44px; height: 44px; border-radius: 8px; object-fit: cover; border: 1px solid rgba(0,0,0,0.06);">
                        </td>
                        <td class="fw-bold">${product.title}</td>
                        <td><span class="badge bg-light text-secondary border px-2 py-1">${product.category}</span></td>
                        <td class="fw-bold text-success">$${product.price}</td>
                        <td>
                            <div class="d-flex align-items-center gap-2">
                                <button class="btn btn-sm btn-light border px-2 py-1 fw-bold" onclick="adjustStockValue(${index}, -1)">-</button>
                                <input type="number" class="form-control text-center py-1" value="${stockVal}" id="stockInput-${index}" style="width: 60px; font-size: 0.88rem;" onchange="updateStockValue(${index}, this.value)">
                                <button class="btn btn-sm btn-light border px-2 py-1 fw-bold" onclick="adjustStockValue(${index}, 1)">+</button>
                            </div>
                        </td>
                        <td>${statusBadge}</td>
                        <td>
                            <button class="btn btn-sm btn-success border-0 rounded-3 px-3 py-1 fw-bold" onclick="saveStockLevel(${index})"><i class="fa-solid fa-check"></i> Save</button>
                        </td>
                    </tr>
                `;
            });
        }
        
        function filterStockTable() {
            renderStockTable();
        }
        
        function adjustStockValue(index, diff) {
            const input = document.getElementById('stockInput-' + index);
            if (input) {
                let val = parseInt(input.value) || 0;
                val = Math.max(0, val + diff);
                input.value = val;
                updateStockValue(index, val);
            }
        }
        
        function updateStockValue(index, val) {
            const stockVal = parseInt(val) || 0;
            products[index].stockVal = stockVal;
            products[index].stock = stockVal > 0 ? 'in-stock' : 'out-of-stock';
            products[index].availability = stockVal > 0 ? 'In Stock' : 'Out of Stock';
        }
        
        function saveStockLevel(index) {
            const p = products[index];
            if (!p) return;

            const token = localStorage.getItem('token');
            const payload = {
                title: p.title,
                category: p.category,
                price: p.price,
                stockVal: p.stockVal,
                stock: p.stock,
                availability: p.availability,
                status: p.status
            };

            fetch(apiUrl(`/api/products/${p.id}`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showAdminNotification(`✅ Stock level for "${p.title}" updated to ${p.stockVal} units.`);
                    renderStockTable();
                } else {
                    notifyAdminError(data.message || 'Request failed.');
                }
            })
            .catch(err => {
                console.error(err);
                notifyAdminError('Could not connect to the server. Try again.');
            });
        }
        
        function saveAllStockLevels() {
            const token = localStorage.getItem('token');
            const promises = products.map(p => {
                const payload = {
                    title: p.title,
                    category: p.category,
                    price: p.price,
                    stockVal: p.stockVal,
                    stock: p.stock,
                    availability: p.availability,
                    status: p.status
                };
                return fetch(apiUrl(`/api/products/${p.id}`), {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                }).then(res => res.json());
            });

            Promise.all(promises)
            .then(results => {
                showAdminNotification("✅ All inventory changes saved successfully.");
                renderStockTable();
            })
            .catch(err => {
                console.error(err);
                notifyAdminError('Could not save stock levels.');
            });
        }

        // ==================== BILLING & MOBILE MONEY PAYMENTS ====================
        function renderPaymentsTable() {
            const tbody = document.getElementById('paymentsTableBody');
            if (!tbody) return;
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">Loading payment transactions...</td></tr>`;

            const token = localStorage.getItem('token');
            fetch(apiUrl('/api/payments/transactions'), {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(data => {
                tbody.innerHTML = '';
                const formatUSD = val => '$' + Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

                if (data.success && data.stats) {
                    document.getElementById('paymentTotalRevenue').textContent = formatUSD(data.stats.totalRevenue);
                    document.getElementById('paymentEvcRevenue').textContent = formatUSD(data.stats.evcRevenue);
                    document.getElementById('paymentSahalRevenue').textContent = formatUSD(data.stats.codRevenue);
                }

                const transactions = data.success ? data.transactions : [];

                if (transactions.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">No payment transactions yet.</td></tr>`;
                    return;
                }

                transactions.forEach(txn => {
                    const order = orders.find(o => o.id === txn.orderId);
                    const customer = order?.customer || '—';
                    const phone = txn.phone || order?.phone || '—';
                    const amount = formatUSD(txn.amount);
                    const statusLabel = txn.status === 'success' ? 'Paid' : txn.status === 'failed' ? 'Failed' : 'Pending';
                    const statusClass = txn.status === 'success' ? 'instock' : txn.status === 'failed' ? 'outofstock' : 'lowstock';
                    const date = txn.createdAt
                        ? new Date(txn.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                        : order?.date || '—';
                    const orderIdx = orders.findIndex(o => o.id === txn.orderId);
                    const actionBtn = txn.status === 'pending' && orderIdx >= 0
                        ? `<button class="btn btn-sm btn-outline-success fw-bold" onclick="markOrderAsPaid(${orderIdx})">Verify</button>`
                        : '—';

                    tbody.innerHTML += `
                        <tr>
                            <td class="font-monospace text-secondary">${txn.transactionId || txn.id}</td>
                            <td class="fw-bold">${customer}</td>
                            <td>${phone}</td>
                            <td><span class="badge bg-light text-secondary border px-2 py-1"><i class="fa-solid fa-mobile-screen me-1 text-success"></i> ${txn.method}</span></td>
                            <td class="fw-bold text-success">${amount}</td>
                            <td><span class="badge-status ${statusClass}">${statusLabel}</span></td>
                            <td>${date}</td>
                            <td>${actionBtn}</td>
                        </tr>
                    `;
                });
            })
            .catch(err => {
                console.error(err);
                tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger py-4">Failed to load payment transactions.</td></tr>`;
            });
        }
        
        function markOrderAsPaid(idx) {
            const order = orders[idx];
            if (!order) return;
            
            const token = localStorage.getItem('token');
            const orderIdEncoded = encodeURIComponent(order.id);

            fetch(apiUrl(`/api/payments/admin/verify/${orderIdEncoded}`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showAdminNotification(`✅ Payment verified successfully for Order ${order.id}.`);
                    switchTab('payments');
                } else {
                    notifyAdminError(data.message || 'Request failed.');
                }
            })
            .catch(err => {
                console.error(err);
                notifyAdminError('Could not connect to the server. Try again.');
            });
        }

        // ==================== DELIVERY & COURIER DISPATCH ====================
        let activeDeliveryIndex = null;
        let approvedDrivers = [];
        const MAX_DRIVER_ACTIVE = 3;

        function isDriverSelectable(driver, selectedId) {
            if (!driver) return false;
            if (selectedId && driver.id === selectedId) return true;
            if (driver.driverStatus === 'offline') return false;
            return (driver.activeDeliveries || 0) < MAX_DRIVER_ACTIVE;
        }

        function driverOptionLabel(driver) {
            const active = driver.activeDeliveries || 0;
            const status = driver.driverStatus || 'available';
            if (status === 'offline') return `${driver.name} (${driver.phone}) — Offline`;
            if (active >= MAX_DRIVER_ACTIVE) return `${driver.name} (${driver.phone}) — At capacity (${active}/${MAX_DRIVER_ACTIVE})`;
            if (status === 'busy' || active > 0) return `${driver.name} (${driver.phone}) — Busy (${active}/${MAX_DRIVER_ACTIVE})`;
            return `${driver.name} (${driver.phone}) — Available`;
        }

        function driverStatusBadgeHtml(driverId, fallbackLabel) {
            const driver = approvedDrivers.find((d) => d.id === driverId);
            if (!driver) {
                return `<span class="badge bg-light text-secondary border px-2 py-1"><i class="fa-solid fa-user-tag me-1 text-primary"></i> ${fallbackLabel || 'Not assigned'}</span>`;
            }
            const active = driver.activeDeliveries || 0;
            let pillClass = 'driver-pill-available';
            let label = 'Available';
            if (driver.driverStatus === 'offline') {
                pillClass = 'driver-pill-offline';
                label = 'Offline';
            } else if (active >= MAX_DRIVER_ACTIVE) {
                pillClass = 'driver-pill-full';
                label = `Full ${active}/${MAX_DRIVER_ACTIVE}`;
            } else if (active > 0) {
                pillClass = 'driver-pill-busy';
                label = `Busy ${active}/${MAX_DRIVER_ACTIVE}`;
            }
            return `<span class="driver-status-pill ${pillClass}"><i class="fa-solid fa-motorcycle me-1"></i>${driver.name} · ${label}</span>`;
        }

        function updateDeliveryDriverHint(order) {
            const hint = document.getElementById('deliveryDriverHint');
            if (!hint || !order) return;

            const current = approvedDrivers.find((d) => d.id === order.assignedDriverId);
            if (current) {
                hint.innerHTML = `<i class="fa-solid fa-arrows-rotate me-1"></i> Current driver: <strong>${current.name}</strong> (${current.activeDeliveries || 0}/${MAX_DRIVER_ACTIVE} active). Choose another driver to reassign.`;
            } else if (order.driver && order.driver !== 'Not assigned yet') {
                hint.innerHTML = `<i class="fa-solid fa-user me-1"></i> Currently: <strong>${order.driver}</strong>. Select an approved driver below to assign or reassign.`;
            } else {
                hint.innerHTML = `<i class="fa-solid fa-circle-info me-1"></i> Offline drivers are blocked. Busy drivers accept new orders until they reach ${MAX_DRIVER_ACTIVE} active deliveries.`;
            }
        }

        async function loadApprovedDrivers() {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const res = await fetch(apiUrl('/api/drivers/approved'), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) approvedDrivers = data.drivers || [];
            } catch (err) {
                console.warn('Could not load approved drivers:', err);
            }
        }

        function populateDriverSelect(selectedId) {
            const select = document.getElementById('deliveryAssignDriver');
            if (!select) return;
            select.innerHTML = '<option value="">— Select driver —</option>';
            approvedDrivers.forEach((driver) => {
                const opt = document.createElement('option');
                opt.value = driver.id;
                opt.textContent = driverOptionLabel(driver);
                opt.disabled = !isDriverSelectable(driver, selectedId);
                if (selectedId && selectedId === driver.id) opt.selected = true;
                select.appendChild(opt);
            });
        }

        function populateOrderDriverSelect(selectedId) {
            const select = document.getElementById('formOrderAssignDriver');
            if (!select) return;
            select.innerHTML = '<option value="">— Select approved driver —</option>';
            approvedDrivers.forEach((driver) => {
                const opt = document.createElement('option');
                opt.value = driver.id;
                opt.textContent = driverOptionLabel(driver);
                opt.disabled = !isDriverSelectable(driver, selectedId);
                if (selectedId && selectedId === driver.id) opt.selected = true;
                select.appendChild(opt);
            });
        }
        
        function getDeliveryStageBadge(step) {
            if (step >= 5) {
                return '<span class="badge bg-success-subtle text-success border px-2 py-1 fw-bold">5. Delivered</span>';
            }
            if (step === 4) {
                return '<span class="badge bg-primary-subtle text-primary border px-2 py-1 fw-bold">4. Out for Delivery</span>';
            }
            if (step === 3) {
                return '<span class="badge bg-info-subtle text-info border px-2 py-1 fw-bold">3. Preparing</span>';
            }
            if (step === 2) {
                return '<span class="badge bg-warning-subtle text-warning border px-2 py-1 fw-bold">2. Payment Verified</span>';
            }
            return '<span class="badge bg-secondary-subtle text-secondary border px-2 py-1 fw-bold">1. Pending</span>';
        }

        function renderDeliveryTable() {
            const tbody = document.getElementById('deliveryTableBody');
            if (!tbody) return;
            tbody.innerHTML = '';

            const dispatchOrders = orders.filter((order) => {
                const step = typeof order.currentStep === 'number' ? order.currentStep : 1;
                const status = (order.status || '').toLowerCase();
                return status !== 'cancelled' && step !== 0;
            });

            let activeCount = 0;
            let completedCount = 0;

            dispatchOrders.forEach((order) => {
                const step = typeof order.currentStep === 'number' ? order.currentStep : 1;
                if (step >= 5 || order.status === 'delivered') {
                    completedCount += 1;
                } else {
                    activeCount += 1;
                }
            });

            document.getElementById('deliveryActiveCount').textContent = activeCount;
            document.getElementById('deliveryCompletedCount').textContent = completedCount;

            if (dispatchOrders.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No orders currently dispatched.</td></tr>`;
                return;
            }

            dispatchOrders.forEach((order, idx) => {
                const step = typeof order.currentStep === 'number' ? order.currentStep : 1;
                const orderIndex = orders.findIndex((o) => o.id === order.id);
                const addressParts = (order.address || '').split(',');
                const district = addressParts.length > 1 ? addressParts[1]?.trim() || addressParts[0] : addressParts[0] || 'Mogadishu';
                const courier = order.driver || 'Not assigned';
                const estimate = order.estimate || 'Estimate pending';
                const deliverySlot = [order.deliveryDate, order.deliveryTime].filter(Boolean).join(' at ');
                const stageBadge = getDeliveryStageBadge(step);

                tbody.innerHTML += `
                    <tr>
                        <td class="font-monospace text-secondary">${order.id}</td>
                        <td class="fw-bold">${order.customer}</td>
                        <td>${district}</td>
                        <td>${driverStatusBadgeHtml(order.assignedDriverId, courier)}</td>
                        <td>${estimate}${deliverySlot ? `<div class="small text-muted">${deliverySlot}</div>` : ''}</td>
                        <td>${stageBadge}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-success fw-bold" onclick="openDeliveryEditModal(${orderIndex >= 0 ? orderIndex : idx})">Edit Stage</button>
                        </td>
                    </tr>
                `;
            });
        }
        
        function openDeliveryEditModal(idx) {
            activeDeliveryIndex = idx;
            const order = orders[idx];
            
            loadApprovedDrivers().then(() => {
                populateDriverSelect(order.assignedDriverId || '');
                updateDeliveryDriverHint(order);
                document.getElementById('deliveryCourier').value = order.driver || '';
                document.getElementById('deliveryEstimate').value = order.estimate || '';
                document.getElementById('deliveryStageSelect').value = typeof order.currentStep === 'number' ? order.currentStep : 1;
                
                const modal = new bootstrap.Modal(document.getElementById('deliveryEditModal'));
                modal.show();
            });
        }
        
        function submitDeliveryUpdate() {
            if (activeDeliveryIndex === null) return;
            const order = orders[activeDeliveryIndex];
            if (!order) return;

            const assignedDriverId = document.getElementById('deliveryAssignDriver')?.value || '';
            const courier = document.getElementById('deliveryCourier').value.trim();
            const estimate = document.getElementById('deliveryEstimate').value.trim();
            const step = parseInt(document.getElementById('deliveryStageSelect').value) || 1;

            const token = localStorage.getItem('token');
            const orderIdEncoded = encodeURIComponent(order.id);

            const assignThenUpdate = assignedDriverId
                ? fetch(apiUrl(`/api/orders/${orderIdEncoded}/assign`), {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ assignedDriverId })
                }).then(res => res.json())
                : Promise.resolve({ success: true });

            assignThenUpdate
            .then((assignData) => {
                if (assignedDriverId && !assignData.success) {
                    showAdminNotification(`❌ ${assignData.message || 'Could not assign driver.'}`, 'danger');
                    return null;
                }
                return fetch(apiUrl(`/api/orders/${orderIdEncoded}`), {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        driver: courier || undefined,
                        estimate: estimate || 'Estimate pending',
                        currentStep: step
                    })
                }).then(res => res.json());
            })
            .then(data => {
                if (!data) return;
                if (data.success) {
                    showAdminNotification(`✅ Dispatch status updated successfully for Order ${order.id}.`);
                    bootstrap.Modal.getInstance(document.getElementById('deliveryEditModal')).hide();
                    loadedScopes.delete('orders');
                    loadedScopes.delete('recentOrders');
                    switchTab('delivery');
                } else {
                    showAdminNotification(`❌ ${data.message || 'Update failed.'}`, 'danger');
                }
            })
            .catch(err => {
                console.error(err);
                showAdminNotification('❌ An error occurred while communicating with the server!', 'danger');
            });
        }

        let activeTicketId = null;
        let currentlyRenderedTicketId = null;

        function getAvatarBgColor(name) {
            const colors = [
                '#073D35', '#0F6F64', '#D8A128', '#2563eb', '#7c3aed', 
                '#db2777', '#e11d48', '#059669', '#d97706', '#475569'
            ];
            if (!name) return colors[0];
            let sum = 0;
            for (let i = 0; i < name.length; i++) {
                sum += name.charCodeAt(i);
            }
            return colors[sum % colors.length];
        }

        function initSupportTickets() {
            // No-op: support tickets are now managed in the backend database
        }

        let supportSseSource = null;

        function connectSupportSse() {
            const token = localStorage.getItem('token');
            if (!token) return;

            if (supportSseSource) {
                supportSseSource.close();
            }

            supportSseSource = new EventSource(`${apiUrl('/api/support/stream')}?token=${encodeURIComponent(token)}`);

            supportSseSource.onmessage = function(event) {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'message' || data.type === 'ticket') {
                        if (data.ticket) {
                            const idx = supportTickets.findIndex(t => t.id === data.ticket.id);
                            if (idx >= 0) {
                                supportTickets[idx] = data.ticket;
                            } else {
                                supportTickets.push(data.ticket);
                            }
                            supportTickets.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
                            renderSupportInboxUI();
                            if (typeof renderOverviewStats === 'function') renderOverviewStats();
                        } else {
                            loadAdminSupportData();
                            return;
                        }

                        if (data.type === 'message' && data.message && activeTicketId === data.message.ticketId) {
                            fetchActiveChatMessages(activeTicketId);
                        }
                    }
                } catch (e) {
                    console.error('Failed to parse SSE event:', e);
                }
            };

            supportSseSource.onerror = function(err) {
                console.error('Admin support SSE connection error, retrying in 5 seconds...', err);
                supportSseSource.close();
                setTimeout(connectSupportSse, 5000);
            };
        }

        async function renderSupportTable() {
            // Immediately load data
            await loadAdminSupportData();

            // Establish real-time support connection
            connectSupportSse();
        }

        async function loadAdminSupportData() {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                // Fetch list of conversations
                const res = await fetch(apiUrl('/api/support/admin/chats'), {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                const data = await res.json();
                if (data.success) {
                    supportTickets = data.tickets.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
                    // Render the sidebar list with filters applied
                    renderSupportInboxUI();
                    // Keep dashboard stats/recent list in sync
                    if (typeof renderOverviewStats === 'function') {
                        renderOverviewStats();
                    }
                }

                // Fetch active chat messages if we have one selected
                if (activeTicketId) {
                    await fetchActiveChatMessages(activeTicketId);
                }
            } catch (err) {
                console.error("Error loading admin support data:", err);
            }
        }

        function renderSupportInboxUI() {
            const inboxList = document.getElementById('supportInboxList');
            if (!inboxList) return;
            
            // Search criteria
            const searchInput = document.getElementById('supportSearchInput');
            const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';
            
            const filterSelect = document.getElementById('supportFilterStatus');
            const statusFilter = filterSelect ? filterSelect.value : 'all';

            const filteredTickets = supportTickets
                .filter(tkt => {
                let matchStatus = true;
                if (statusFilter !== 'all') {
                    if (statusFilter === 'Open') {
                        matchStatus = (tkt.status === 'Open' || tkt.status === 'New');
                    } else {
                        matchStatus = (tkt.status === statusFilter);
                    }
                }
                
                let matchSearch = true;
                if (searchVal) {
                    matchSearch = (
                        tkt.name.toLowerCase().includes(searchVal) ||
                        tkt.subject.toLowerCase().includes(searchVal) ||
                        (tkt.lastMessageText && tkt.lastMessageText.toLowerCase().includes(searchVal)) ||
                        tkt.id.toLowerCase().includes(searchVal)
                    );
                }
                
                return matchStatus && matchSearch;
            })
                .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

            if (filteredTickets.length === 0) {
                inboxList.innerHTML = `<div class="text-center text-muted py-5" style="font-size: 0.85rem;">No messages found.</div>`;
                renderSupportChat(null);
                return;
            }

            // If activeTicketId is not set or not in filtered set, default to first ticket
            const stillExists = filteredTickets.some(t => t.id === activeTicketId);
            if (!stillExists && filteredTickets.length > 0) {
                activeTicketId = filteredTickets[0].id;
            }

            inboxList.innerHTML = '';
            filteredTickets.forEach(tkt => {
                const isActive = tkt.id === activeTicketId;
                const statusClass = tkt.status === 'Open' || tkt.status === 'New' ? 'support-badge-new' :
                                    tkt.status === 'Pending' ? 'support-badge-pending' :
                                    tkt.status === 'Replied' ? 'support-badge-resolved' : 'support-badge-closed';
                
                let statusText = tkt.status;
                if (statusText === 'Open') statusText = 'New';
                if (statusText === 'Replied') statusText = 'Resolved';
                
                // Fetch User avatar if available in the global users list
                const userObj = users.find(u => u.email === tkt.email);
                const avatarBase64 = userObj ? userObj.avatar : '';
                
                let avatarHtml = '';
                if (avatarBase64) {
                    avatarHtml = `<div class="support-avatar" style="background-image: url('${avatarBase64}');"></div>`;
                } else {
                    const firstLetter = tkt.name.charAt(0).toUpperCase();
                    const bgCol = getAvatarBgColor(tkt.name);
                    avatarHtml = `<div class="support-avatar" style="background-color: ${bgCol};">${firstLetter}</div>`;
                }
                
                let timeStr = 'Just now';
                if (tkt.lastMessageAt) {
                    const diffMs = new Date() - new Date(tkt.lastMessageAt);
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMins / 60);
                    if (diffMins < 1) timeStr = 'Just now';
                    else if (diffMins < 60) timeStr = `${diffMins}m ago`;
                    else if (diffHours < 24) timeStr = `${diffHours}h ago`;
                    else timeStr = new Date(tkt.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
                }
                
                const msgSnippet = tkt.lastMessageText || tkt.subject || 'No messages';
                
                inboxList.innerHTML += `
                    <div class="support-ticket-item ${isActive ? 'active' : ''}" onclick="selectSupportTicket('${tkt.id}')">
                        ${avatarHtml}
                        <div class="support-item-info">
                            <div class="support-item-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <span class="support-item-name" style="font-weight: 700; font-size: 0.9rem; color: var(--dark-gray);">${tkt.name}</span>
                                <span class="support-item-time" style="font-size: 0.75rem; color: #9ca3af;">${timeStr}</span>
                            </div>
                            <div class="support-item-body" style="display: flex; justify-content: space-between; align-items: center;">
                                <span class="support-item-msg" style="font-size: 0.8rem; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-grow: 1; margin-right: 10px; margin-bottom: 0;">${msgSnippet}</span>
                                <span class="support-item-badge ${statusClass}">${statusText}</span>
                            </div>
                        </div>
                    </div>
                `;
            });

            const activeTicket = supportTickets.find(t => t.id === activeTicketId);
            renderSupportChat(activeTicket);
        }

        function selectSupportTicket(ticketId) {
            activeTicketId = ticketId;
            // Fetch messages for the selected ticket immediately
            fetchActiveChatMessages(ticketId);
            // Re-render sidebar inbox to reflect highlighted state
            renderSupportInboxUI();
        }

        function onSupportSearchOrFilter() {
            renderSupportInboxUI();
        }

        async function fetchActiveChatMessages(ticketId) {
            if (!ticketId) return;
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const res = await fetch(apiUrl(`/api/support/chats/${ticketId}/messages`), {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                const data = await res.json();
                if (data.success) {
                    renderSupportChatMessagesUI(data.ticket, data.messages);
                }
            } catch (err) {
                console.error("Error fetching messages for ticket " + ticketId, err);
            }
        }

        function renderSupportChat(tkt) {
            const chatWindow = document.getElementById('supportChatWindow');
            if (!chatWindow) return;
            
            if (!tkt) {
                currentlyRenderedTicketId = null;
                chatWindow.innerHTML = `
                    <div class="support-chat-empty-state">
                        <i class="fa-solid fa-comments support-chat-empty-icon"></i>
                        <h5>No Conversation Selected</h5>
                        <p class="text-muted" style="font-size: 0.85rem; max-width: 320px;">
                            Select a ticket from the left inbox list to view details and send replies.
                        </p>
                    </div>
                `;
                return;
            }
            
            // Only render outer layout if selected ticket ID changed
            if (currentlyRenderedTicketId !== tkt.id) {
                currentlyRenderedTicketId = tkt.id;
                
                const userObj = users.find(u => u.email === tkt.email);
                const avatarBase64 = userObj ? userObj.avatar : '';
                
                let avatarHtml = '';
                if (avatarBase64) {
                    avatarHtml = `<div class="support-avatar" style="background-image: url('${avatarBase64}'); width: 40px; height: 40px; margin-right: 10px;"></div>`;
                } else {
                    const firstLetter = tkt.name.charAt(0).toUpperCase();
                    const bgCol = getAvatarBgColor(tkt.name);
                    avatarHtml = `<div class="support-avatar" style="background-color: ${bgCol}; width: 40px; height: 40px; margin-right: 10px;">${firstLetter}</div>`;
                }
                
                chatWindow.innerHTML = `
                    <!-- Chat Header -->
                    <div class="support-chat-header">
                        ${avatarHtml}
                        <div>
                            <div class="support-chat-header-name">${tkt.name}</div>
                            <div class="support-chat-header-email">${tkt.email} • Ticket ID: ${tkt.id}</div>
                        </div>
                    </div>
                    
                    <!-- Chat Message History -->
                    <div class="support-chat-messages" id="supportChatHistory">
                        <div class="text-center py-4 text-muted">
                            <i class="fa-solid fa-circle-notch fa-spin me-2"></i>Loading messages...
                        </div>
                    </div>
                    
                    <!-- Chat Input Form -->
                    <div class="support-chat-input-area">
                        <div class="support-chat-input-form">
                            <textarea id="supportReplyMessage" placeholder="Type your reply..." onkeydown="handleSupportReplyKey(event)"></textarea>
                            <button class="support-chat-send-btn" onclick="submitSupportReply()" title="Send Message">
                                <i class="fa-regular fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                `;
                
                // Fetch the chat history immediately
                fetchActiveChatMessages(tkt.id);
            }
        }

        function renderSupportChatMessagesUI(tkt, messages) {
            const historyDiv = document.getElementById('supportChatHistory');
            if (!historyDiv) return;

            let bubblesHtml = '';
            if (messages.length === 0) {
                bubblesHtml = `<div class="text-center py-5 text-muted">No messages in this thread.</div>`;
            } else {
                messages.forEach(msg => {
                    const isUser = msg.senderRole === 'user';
                    const bubbleClass = isUser ? 'customer-msg' : 'admin-msg';
                    
                    let timeStr = '';
                    if (msg.createdAt) {
                        const dateObj = new Date(msg.createdAt);
                        timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
                    }
                    
                    let subjectHeader = '';
                    if (isUser && msg.id === messages[0].id) {
                        subjectHeader = `<div class="fw-bold mb-1" style="font-size: 0.75rem; color: #073D35;">Subject: ${tkt.subject}</div>`;
                    }
                    
                    bubblesHtml += `
                        <div class="support-chat-bubble-wrap ${bubbleClass}">
                            <div class="support-chat-bubble">
                                ${subjectHeader}
                                ${msg.messageText}
                                <span class="support-chat-time">${timeStr}</span>
                            </div>
                        </div>
                    `;
                });
            }

            // Only update DOM if the content changed to avoid scroll glitches
            if (historyDiv.innerHTML !== bubblesHtml) {
                const wasScrolledToBottom = historyDiv.scrollHeight - historyDiv.clientHeight <= historyDiv.scrollTop + 50;
                
                historyDiv.innerHTML = bubblesHtml;
                
                if (wasScrolledToBottom || historyDiv.getAttribute('data-loaded') !== 'true') {
                    historyDiv.setAttribute('data-loaded', 'true');
                    setTimeout(() => {
                        historyDiv.scrollTop = historyDiv.scrollHeight;
                    }, 50);
                }
            }
        }

        function handleSupportReplyKey(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submitSupportReply();
            }
        }

        async function submitSupportReply() {
            if (activeTicketId === null) return;
            const replyInput = document.getElementById('supportReplyMessage');
            if (!replyInput) return;
            const reply = replyInput.value.trim();
            if (!reply) {
                notifyAdminWarning('Please write your reply first.');
                return;
            }
            
            const token = localStorage.getItem('token');
            if (!token) return;
            
            replyInput.disabled = true;
            
            try {
                const res = await fetch(apiUrl(`/api/support/chats/${activeTicketId}/messages`), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ messageText: reply })
                });
                
                const data = await res.json();
                replyInput.disabled = false;
                
                if (data.success) {
                    replyInput.value = '';
                    replyInput.focus();
                    
                    showAdminNotification(`✅ Reply sent successfully.`);
                    
                    // Refresh active messages and tickets lists immediately
                    await fetchActiveChatMessages(activeTicketId);
                    await loadAdminSupportData();
                } else {
                    notifyAdminError(data.message || 'Request failed.');
                }
            } catch (err) {
                replyInput.disabled = false;
                console.error(err);
                notifyAdminError('Could not connect to the server. Try again.');
            }
        }

        // ==================== RATINGS & REVIEWS ====================
        const defaultReviews = [
            { id: 1, product: "Bloom Accent Chair Set", customer: "Abdifatah Hassan", rating: 4, comment: "Kursi aad u raaxo badan, guriga wuu qurxiyay.", date: "2026-06-22", status: "Approved" },
            { id: 2, product: "Blush Velvet Arch Bed", customer: "Amina Yusuf", rating: 5, comment: "Furaashka iyo sariirta tayadoodu waa heer sare. Waan ku qancay.", date: "2026-06-21", status: "Pending" },
            { id: 3, product: "Ivory Cloud Sofa Set", customer: "Mohamed Nur", rating: 3, comment: "Soofaha waa fiican yahay, laakiin keenista ayaa yara daahday.", date: "2026-06-20", status: "Approved" }
        ];

        function initReviews() {
            if (!localStorage.getItem('productReviews')) {
                localStorage.setItem('productReviews', JSON.stringify(defaultReviews));
            }
        }

        function renderReviewsTable() {
            const tbody = document.getElementById('reviewsTableBody');
            if (!tbody) return;
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">Loading reviews...</td></tr>';

            const token = localStorage.getItem('token');
            fetch(apiUrl('/api/reviews'), {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            })
            .then(res => res.json())
            .then(data => {
                tbody.innerHTML = '';
                const reviewsList = data.success ? data.reviews : (JSON.parse(localStorage.getItem('productReviews')) || defaultReviews);

                if (!reviewsList.length) {
                    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No reviews submitted yet.</td></tr>`;
                    return;
                }

                reviewsList.forEach((rev) => {
                    const status = rev.status === 'approved' ? 'Approved' : rev.status === 'rejected' ? 'Rejected' : (rev.status || 'Pending');
                    const statusClass = status === 'Approved' ? 'instock' : 'outofstock';
                    let stars = '';
                    const rating = rev.rating || 0;
                    for (let i = 0; i < 5; i++) {
                        stars += i < rating ? '<i class="fa-solid fa-star text-warning"></i>' : '<i class="fa-regular fa-star text-secondary"></i>';
                    }

                    const reviewId = rev.id;
                    const actionBtn = status === 'Pending' || status === 'pending'
                        ? `<button class="btn btn-sm btn-success border-0 rounded-3 px-3 py-1 fw-bold me-1" onclick="approveReview('${reviewId}')">Approve</button>
                           <button class="btn btn-sm btn-outline-warning border-2 rounded-3 px-3 py-1 fw-bold" onclick="rejectReview('${reviewId}')">Reject</button>`
                        : `<button class="btn btn-sm btn-outline-danger border-2 rounded-3 px-3 py-1 fw-bold" onclick="deleteReview('${reviewId}')">Delete</button>`;

                    const date = rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : (rev.date || '');

                    tbody.innerHTML += `
                        <tr>
                            <td class="fw-bold text-success">${rev.productTitle || rev.product}</td>
                            <td class="fw-bold">${rev.userName || rev.customer}</td>
                            <td>${stars}</td>
                            <td class="text-secondary" style="max-width: 250px;">${rev.comment || ''}</td>
                            <td>${date}</td>
                            <td><span class="badge-status ${statusClass}">${status}</span></td>
                            <td>${actionBtn}</td>
                        </tr>
                    `;
                });
            })
            .catch(() => {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">Failed to load reviews.</td></tr>`;
            });
        }
        
        window.approveReview = async function(reviewId) {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(apiUrl(`/api/reviews/${reviewId}/status`), {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ status: 'approved' })
                });
                const data = await res.json();
                if (data.success) {
                    showAdminNotification("✅ Review approved successfully.");
                    renderReviewsTable();
                }
            } catch {
                showAdminNotification("❌ Failed to approve review.", true);
            }
        }

        window.rejectReview = async function(reviewId) {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(apiUrl(`/api/reviews/${reviewId}/status`), {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ status: 'rejected' })
                });
                const data = await res.json();
                if (data.success) {
                    showAdminNotification("Review rejected.");
                    renderReviewsTable();
                }
            } catch {
                showAdminNotification("❌ Failed to reject review.", true);
            }
        }
        
        window.deleteReview = async function(reviewId) {
            if (!confirm("Ma hubtaa inaad rabto inaad tirtirto review-gan?")) return;
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(apiUrl(`/api/reviews/${reviewId}`), {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    showAdminNotification("✅ Review deleted successfully.");
                    renderReviewsTable();
                }
            } catch {
                showAdminNotification("❌ Failed to delete review.", true);
            }
        }


        function attachAdminFormHandlers() {
            const bind = (id, event, fn) => {
                const el = document.getElementById(id);
                if (!el || el.dataset.adminBound === 'true') return;
                el.dataset.adminBound = 'true';
                el.addEventListener(event, (e) => {
                    if (typeof fn === 'function') fn(e);
                });
            };

            bind('productSearchQuery', 'input', () => filterProductsTable());
            bind('productFilterCategory', 'change', () => filterProductsTable());
            bind('productFilterStatus', 'change', () => filterProductsTable());
            bind('productFilterStock', 'change', () => filterProductsTable());
            bind('orderSearchQuery', 'input', () => onOrderFilterChange());
            bind('orderFilterStatus', 'change', () => onOrderFilterChange());
            bind('orderFilterPayment', 'change', () => onOrderFilterChange());
            bind('orderFilterDate', 'change', () => onOrderFilterChange());
            bind('customerSearchQuery', 'input', () => filterCustomersTable());
            bind('stockSearchQuery', 'input', () => filterStockTable());
            bind('supportSearchInput', 'input', () => onSupportSearchOrFilter());
            bind('supportFilterStatus', 'change', () => onSupportSearchOrFilter());

            const productForm = document.getElementById('productForm');
            if (productForm && productForm.dataset.adminBound !== 'true') {
                productForm.dataset.adminBound = 'true';
                productForm.addEventListener('submit', handleProductFormSubmit);
            }

            const orderEditForm = document.getElementById('orderEditForm');
            if (orderEditForm && orderEditForm.dataset.adminBound !== 'true') {
                orderEditForm.dataset.adminBound = 'true';
                orderEditForm.addEventListener('submit', handleOrderEditSubmit);
            }

            const userEditForm = document.getElementById('userEditForm');
            if (userEditForm && userEditForm.dataset.adminBound !== 'true') {
                userEditForm.dataset.adminBound = 'true';
                userEditForm.addEventListener('submit', handleUserEditSubmit);
            }

            const imageFile = document.getElementById('formProductImageFile');
            if (imageFile && imageFile.dataset.adminBound !== 'true') {
                imageFile.dataset.adminBound = 'true';
                imageFile.addEventListener('change', () => convertImageToBase64(imageFile));
            }
        }

        const adminExports = {
            switchTab,
            filterProductsTable,
            openAddProductModal,
            openViewProductModal,
            openEditProductModal,
            convertImageToBase64,
            handleProductFormSubmit,
            deleteProduct,
            onOrderFilterChange,
            exportOrdersToCSV,
            openOrderEditModal,
            handleOrderEditSubmit,
            filterCustomersTable,
            deleteCustomer,
            openViewUserModal,
            openEditUserModal,
            handleUserEditSubmit,
            toggleUserActive,
            saveSettings,
            resetSystemData,
            filterStockTable,
            adjustStockValue,
            updateStockValue,
            saveStockLevel,
            saveAllStockLevels,
            markOrderAsPaid,
            openDeliveryEditModal,
            submitDeliveryUpdate,
            selectSupportTicket,
            onSupportSearchOrFilter,
            submitSupportReply,
            approveReview,
            rejectReview,
            deleteReview,
            adminLogout,
            setOrderPage,
        };

        Object.assign(window, adminExports);

        window.switchTab = switchTab;

        function bootAdminDashboard() {
            if (window.__adminDashboardBooted) return;
            window.__adminDashboardBooted = true;

            const adminAppContent = document.getElementById('adminAppContent');
            if (adminAppContent) adminAppContent.style.display = 'flex';

            initSupportTickets();
            initReviews();
            attachAdminFormHandlers();
            switchTab('dashboard').then(() => {
                initCharts();
                attachAdminFormHandlers();
            });
        }

        bootAdminDashboard();
    
}
