const PHONE_E164 = '252615720509';
export const HELP_PHONE_E164 = PHONE_E164;
export const HELP_PHONE_HREF = `tel:+${PHONE_E164}`;
export const HELP_WHATSAPP_HREF = `https://wa.me/${PHONE_E164}`;

export const HELP_CATEGORIES = [
  { id: 'general', label: 'General' },
  { id: 'account', label: 'Account' },
  { id: 'payment', label: 'Payment' },
  { id: 'orders', label: 'Orders' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'products', label: 'Products' },
  { id: 'returns', label: 'Returns' },
  { id: 'reviews', label: 'Reviews' },
];

export const HELP_FAQS = [
  // —— General (8)
  {
    id: 'g1',
    category: 'general',
    q: 'What is Mogadishu Modern Furniture?',
    a: 'We are an online furniture store based in Mogadishu. You can browse, order, pay with EVC Plus, and get delivery across Banadir districts.',
  },
  {
    id: 'g2',
    category: 'general',
    q: 'Do I need an account to shop?',
    a: 'You can browse as a guest, but signing in is required to checkout, track orders, save a wishlist, and leave reviews.',
  },
  {
    id: 'g3',
    category: 'general',
    q: 'What languages and currency do you use?',
    a: 'The app is in English. Prices are shown in USD. Payment is completed locally through EVC Plus / Waafi.',
  },
  {
    id: 'g4',
    category: 'general',
    q: 'How do I contact support?',
    a: 'Scroll to Contact Us on this Help Center page. You can call, open WhatsApp, or message Customer Service.',
  },
  {
    id: 'g5',
    category: 'general',
    q: 'What are your support hours?',
    a: 'Customer Service is typically available Saturday–Thursday, 9:00 AM–6:00 PM Mogadishu time. WhatsApp messages can be sent anytime.',
  },
  {
    id: 'g6',
    category: 'general',
    q: 'Is the mobile app the same as the website?',
    a: 'Yes — the /app experience is our mobile store. Your account, cart, and orders sync with the same backend.',
  },
  {
    id: 'g7',
    category: 'general',
    q: 'Can I save items for later?',
    a: 'Yes. Tap the heart on a product to add it to Wishlist under Profile.',
  },
  {
    id: 'g8',
    category: 'general',
    q: 'Where can I see my coupons?',
    a: 'If a coupon applies, enter the code at checkout. Valid discounts are calculated before you confirm payment.',
  },

  // —— Account (7)
  {
    id: 'a1',
    category: 'account',
    q: 'How do I create an account?',
    a: 'Open Sign up, enter your name, email, phone, and password. After registration you can shop and manage your profile.',
  },
  {
    id: 'a2',
    category: 'account',
    q: 'How do I sign in?',
    a: 'Use the email or phone you registered with, plus your password. From Profile you can also open Sign in if you are logged out.',
  },
  {
    id: 'a3',
    category: 'account',
    q: 'How do I update my profile?',
    a: 'Go to Profile → Personal information → Edit. You can update name, address, photo, and header color. Email and phone stay as login identity.',
  },
  {
    id: 'a4',
    category: 'account',
    q: 'Can I change my email or phone?',
    a: 'Email and phone are used for login and are read-only in the app. Contact Customer Service if you need them updated.',
  },
  {
    id: 'a5',
    category: 'account',
    q: 'How do I change my password?',
    a: 'Open Profile → Settings and use Change password. You’ll need your current password and a new one (at least 8 characters).',
  },
  {
    id: 'a6',
    category: 'account',
    q: 'I forgot my password. What now?',
    a: 'Use Forgot password on the login screen if available, or contact Customer Service with the phone/email on your account.',
  },
  {
    id: 'a7',
    category: 'account',
    q: 'How do I manage notifications?',
    a: 'Go to Profile → Settings and turn email, SMS, or push alerts on or off.',
  },

  // —— Payment (8)
  {
    id: 'p1',
    category: 'payment',
    q: 'Which payment methods do you accept?',
    a: 'Checkout uses EVC Plus through Waafi. Enter your Somali mobile number and approve the payment prompt on your phone.',
  },
  {
    id: 'p2',
    category: 'payment',
    q: 'How do I complete an EVC Plus payment?',
    a: 'Place the order, wait for the Waafi/EVC prompt, enter your PIN, and confirm. The order moves forward only after payment succeeds.',
  },
  {
    id: 'p3',
    category: 'payment',
    q: 'Payment failed. What should I do?',
    a: 'Check your balance and network, then retry from the order/payment screen. If money was deducted but the order stays unpaid, contact us with the time and number used.',
  },
  {
    id: 'p4',
    category: 'payment',
    q: 'Was I charged twice?',
    a: 'Sometimes a bank or wallet shows a pending hold. Share your Order ID and transaction time with Customer Service so we can verify.',
  },
  {
    id: 'p5',
    category: 'payment',
    q: 'When do refunds appear?',
    a: 'After a refund is approved, it returns to the original mobile money method. Timing depends on your provider.',
  },
  {
    id: 'p6',
    category: 'payment',
    q: 'Can I pay cash on delivery?',
    a: 'Online orders are paid through EVC Plus before delivery. If you need another option, message Customer Service before ordering.',
  },
  {
    id: 'p7',
    category: 'payment',
    q: 'Are prices inclusive of delivery?',
    a: 'Product prices are shown separately. Delivery fee is added at checkout based on your district.',
  },
  {
    id: 'p8',
    category: 'payment',
    q: 'Is payment secure?',
    a: 'Payments are processed through Waafi. We do not store your EVC PIN.',
  },

  // —— Orders (8)
  {
    id: 'o1',
    category: 'orders',
    q: 'How do I place an order?',
    a: 'Add items to cart, go to checkout, confirm address and payment number, then complete EVC Plus payment.',
  },
  {
    id: 'o2',
    category: 'orders',
    q: 'Where do I find my Order ID?',
    a: 'After checkout you’ll see the Order ID on the confirmation screen and under Profile → My Orders.',
  },
  {
    id: 'o3',
    category: 'orders',
    q: 'How do I track an order?',
    a: 'Open My Orders and select the order, or use Track with your Order ID to follow status updates.',
  },
  {
    id: 'o4',
    category: 'orders',
    q: 'What do the order statuses mean?',
    a: 'Processing means we received payment. Shipped / out for delivery means a driver is handling it. Delivered means it reached you. Cancelled means the order was stopped.',
  },
  {
    id: 'o5',
    category: 'orders',
    q: 'Can I cancel an order?',
    a: 'Yes, while it is still processing (before out for delivery). Use the cancel option on the order or contact support.',
  },
  {
    id: 'o6',
    category: 'orders',
    q: 'Can I change my delivery address?',
    a: 'Address changes are only possible early in processing. After the order is assigned or out for delivery, changes may not be possible.',
  },
  {
    id: 'o7',
    category: 'orders',
    q: 'How do I download an invoice?',
    a: 'Open the order details and use View Invoice when available.',
  },
  {
    id: 'o8',
    category: 'orders',
    q: 'My order is stuck on processing.',
    a: 'Paid orders usually move soon after confirmation. If it stays unchanged for a long time, contact us with your Order ID.',
  },

  // —— Delivery (8)
  {
    id: 'd1',
    category: 'delivery',
    q: 'Where do you deliver?',
    a: 'We deliver across major Banadir districts in Mogadishu. Select your district at checkout to see the fee.',
  },
  {
    id: 'd2',
    category: 'delivery',
    q: 'How long does delivery take?',
    a: 'Most paid orders arrive within 1–3 business days, depending on district, stock, and traffic.',
  },
  {
    id: 'd3',
    category: 'delivery',
    q: 'How is the delivery fee calculated?',
    a: 'Fees vary by district. The exact amount is shown at checkout before you pay.',
  },
  {
    id: 'd4',
    category: 'delivery',
    q: 'Will someone call before delivery?',
    a: 'Drivers may call the phone number on your order when they are nearby. Keep that number reachable.',
  },
  {
    id: 'd5',
    category: 'delivery',
    q: 'Who is my driver?',
    a: 'When a driver is assigned, you can see driver details in tracking / order progress where available.',
  },
  {
    id: 'd6',
    category: 'delivery',
    q: 'I missed the delivery. What now?',
    a: 'Contact support or the driver if their number is shown. We’ll help reschedule when possible.',
  },
  {
    id: 'd7',
    category: 'delivery',
    q: 'Do you deliver outside Mogadishu?',
    a: 'Standard delivery covers Banadir districts. For special destinations, message Customer Service before ordering.',
  },
  {
    id: 'd8',
    category: 'delivery',
    q: 'Can I choose a delivery time?',
    a: 'We aim for the earliest available slot after payment. Specific time windows aren’t always guaranteed.',
  },

  // —— Products (7)
  {
    id: 'pr1',
    category: 'products',
    q: 'Are product photos accurate?',
    a: 'We use real product photos. Slight color differences can happen because of lighting and phone screens.',
  },
  {
    id: 'pr2',
    category: 'products',
    q: 'How do I know if an item is in stock?',
    a: 'Availability is shown on the product page. Out-of-stock items can’t be added to cart.',
  },
  {
    id: 'pr3',
    category: 'products',
    q: 'Can I request a custom size or color?',
    a: 'Most items are sold as listed. For special requests, contact Customer Service before you order.',
  },
  {
    id: 'pr4',
    category: 'products',
    q: 'Do products include assembly?',
    a: 'Assembly depends on the item. Check the product description; some pieces arrive ready, others may need simple setup.',
  },
  {
    id: 'pr5',
    category: 'products',
    q: 'How do I search for furniture?',
    a: 'Use Search on Home or Shop, or browse by category such as sofa, bed, table, and outdoor.',
  },
  {
    id: 'pr6',
    category: 'products',
    q: 'Can I buy multiple quantities?',
    a: 'Yes. Set quantity on the product page or in cart before checkout, as long as stock allows.',
  },
  {
    id: 'pr7',
    category: 'products',
    q: 'Why did a product disappear from my cart?',
    a: 'Items can be removed if stock changes or the product becomes unavailable. Add it again if it’s back in stock.',
  },

  // —— Returns (7)
  {
    id: 'r1',
    category: 'returns',
    q: 'What is your return policy?',
    a: 'Report damaged, wrong, or defective items as soon as possible after delivery. We’ll review your Order ID and details.',
  },
  {
    id: 'r2',
    category: 'returns',
    q: 'What if something arrives damaged?',
    a: 'Contact us the same day with photos and your Order ID. We’ll arrange a fair resolution after checking with delivery.',
  },
  {
    id: 'r3',
    category: 'returns',
    q: 'I received the wrong item.',
    a: 'Message Customer Service immediately with your Order ID and a photo of what arrived. We’ll correct it.',
  },
  {
    id: 'r4',
    category: 'returns',
    q: 'Can I return unused furniture?',
    a: 'Returns for change-of-mind depend on condition and timing. Contact support before sending anything back.',
  },
  {
    id: 'r5',
    category: 'returns',
    q: 'How do refunds work after a return?',
    a: 'Once a return or claim is approved, refunds go back to the original payment method.',
  },
  {
    id: 'r6',
    category: 'returns',
    q: 'Who pays return delivery?',
    a: 'If the issue is our error (damage/wrong item), we cover the resolution. Other cases are handled case by case.',
  },
  {
    id: 'r7',
    category: 'returns',
    q: 'How long do I have to report a problem?',
    a: 'Report issues as soon as you notice them — ideally the same day as delivery — so we can investigate quickly.',
  },

  // —— Reviews (6)
  {
    id: 'v1',
    category: 'reviews',
    q: 'When can I leave a review?',
    a: 'After an order is delivered and paid, it appears under Profile → Reviews so you can rate delivery and products.',
  },
  {
    id: 'v2',
    category: 'reviews',
    q: 'What should I rate?',
    a: 'Rate the delivery/driver and each product in that order. Progress shows how many ratings are left.',
  },
  {
    id: 'v3',
    category: 'reviews',
    q: 'Why did an order leave the Reviews list?',
    a: 'Once delivery and all products for that order are rated, the order is removed from the to-rate list.',
  },
  {
    id: 'v4',
    category: 'reviews',
    q: 'Are product reviews public?',
    a: 'Product reviews are moderated. After approval they can appear on the product page.',
  },
  {
    id: 'v5',
    category: 'reviews',
    q: 'Can I edit a review?',
    a: 'Submitted product reviews can’t be edited in the app. Contact support if something needs correction.',
  },
  {
    id: 'v6',
    category: 'reviews',
    q: 'Do I have to write a comment?',
    a: 'Stars are required. Comments are optional but help other customers.',
  },
];
