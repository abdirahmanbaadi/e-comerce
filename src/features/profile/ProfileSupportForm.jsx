import { useEffect, useState } from 'react';
import { apiUrl } from '../../utils/data';
import { showTopFloatNotification } from '../../utils/notifications';

const SUBJECT_OPTIONS = [
  'Payment Issue',
  'Delivery Delay',
  'Product Damage',
  'Account Issue',
  'Order Cancellation',
  'Other',
];

const selectClass =
  'w-full cursor-pointer appearance-none rounded-[10px] border-[1.5px] border-black/[0.08] bg-white px-4 py-3 text-[0.88rem] text-[#4b5563] outline-none transition focus:border-deepGreen focus:shadow-[0_0_0_3px_rgba(7,61,53,0.08)]';

export default function ProfileSupportForm({ supportChat }) {
  const [subject, setSubject] = useState('');
  const [relatedOrder, setRelatedOrder] = useState('');
  const [message, setMessage] = useState('');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const { createConversation, sending } = supportChat;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoadingOrders(false);
      return;
    }

    fetch(apiUrl('/api/orders'), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setOrders((data.orders || []).slice(0, 20));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingOrders(false));
  }, []);

  const handleSubmit = async () => {
    if (!subject) {
      showTopFloatNotification('Please select a subject.', 'warning');
      return;
    }
    if (!message.trim()) {
      showTopFloatNotification('Please write your message.', 'warning');
      return;
    }

    const body = relatedOrder
      ? `Related order: ${relatedOrder}\n\n${message.trim()}`
      : message.trim();

    const ok = await createConversation(subject, body, '', { openAfterCreate: false });
    if (ok) {
      setSubject('');
      setRelatedOrder('');
      setMessage('');
    }
  };

  return (
    <section className="flex h-full flex-col rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] sm:p-7">
      <h3 className="mb-6 text-[1.2rem] font-bold text-deepGreen">Submit a Support Request</h3>

      <div className="grid flex-1 content-start gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="supportSubject" className="mb-2 block text-[0.82rem] font-bold text-[#1c3022]">
              Subject
            </label>
            <div className="relative">
              <select
                id="supportSubject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={selectClass}
              >
                <option value="">Select subject…</option>
                {SUBJECT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <i className="fa-solid fa-chevron-down pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[0.75rem] text-gray-500" />
            </div>
          </div>

          <div>
            <label htmlFor="supportOrder" className="mb-2 block text-[0.82rem] font-bold text-[#1c3022]">
              Related Order <span className="font-medium text-gray-400">(Optional)</span>
            </label>
            <div className="relative">
              <select
                id="supportOrder"
                value={relatedOrder}
                onChange={(e) => setRelatedOrder(e.target.value)}
                className={selectClass}
                disabled={loadingOrders}
              >
                <option value="">Select order…</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.id}
                  </option>
                ))}
              </select>
              <i className="fa-solid fa-chevron-down pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[0.75rem] text-gray-500" />
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <label htmlFor="supportMessage" className="mb-2 block text-[0.82rem] font-bold text-[#1c3022]">
            Message
          </label>
          <div className="relative flex-1">
            <textarea
              id="supportMessage"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your problem here..."
              className="h-full min-h-[220px] w-full resize-none rounded-xl border-[1.5px] border-black/[0.08] px-4 py-4 pr-14 text-[0.88rem] leading-relaxed outline-none transition focus:border-deepGreen focus:shadow-[0_0_0_3px_rgba(7,61,53,0.08)] lg:min-h-[260px]"
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={sending}
              className="absolute bottom-5 right-5 flex h-10 w-10 items-center justify-center border-0 bg-transparent p-0 text-[1.35rem] text-deepGreen transition hover:scale-110 disabled:opacity-40"
              title="Send request"
              aria-label="Send support request"
            >
              <i className={`fa-solid fa-paper-plane ${sending ? 'fa-spinner fa-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
