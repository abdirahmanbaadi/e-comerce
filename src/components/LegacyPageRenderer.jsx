import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/auth.css';
import { initializeLocalStorage } from '../utils/data';
import { showTopFloatNotification, togglePasswordVisibility, showAlert, showModalError } from '../utils/notifications';

const ROUTE_MAP = {
  'index.html': '/',
  'home.html': '/',
  'products.html': '/products',
  'categories.html': '/categories',
  'cart.html': '/cart',
  'checkout.html': '/checkout',
  'login.html': '/login',
  'register.html': '/register',
  'profile.html': '/profile',
  'track-order.html': '/track-order',
  'admin.html': '/admin',
};

function resolveRoute(href) {
  if (!href || href === '#' || href.startsWith('javascript:')) return null;
  if (ROUTE_MAP[href]) return ROUTE_MAP[href];
  try {
    const url = new URL(href, window.location.origin);
    const filename = url.pathname.split('/').pop();
    if (ROUTE_MAP[filename]) return ROUTE_MAP[filename];
    if (url.origin === window.location.origin) {
      const path = url.pathname;
      if (path === '/' || path === '') return '/';
      const clean = path.replace(/^\//, '').replace(/\.html$/, '');
      const map = { products: '/products', categories: '/categories', cart: '/cart', checkout: '/checkout', login: '/login', register: '/register', profile: '/profile', 'track-order': '/track-order', admin: '/admin', index: '/', home: '/' };
      if (map[clean]) return map[clean];
    }
  } catch {
    if (href.startsWith('/')) return href;
  }
  return null;
}

function extractPageParts(html) {
  const styles = [];
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match;
  while ((match = styleRegex.exec(html)) !== null) {
    styles.push(match[1]);
  }

  const externalScripts = [];
  const externalRegex = /<script[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi;
  while ((match = externalRegex.exec(html)) !== null) {
    externalScripts.push(match[1]);
  }

  const scripts = [];
  const scriptRegex = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  while ((match = scriptRegex.exec(html)) !== null) {
    scripts.push(match[1]);
  }

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  let body = bodyMatch ? bodyMatch[1] : html;
  body = body.replace(/<script[\s\S]*?<\/script>/gi, '');

  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : 'Mogadishu Modern Furniture';

  return { styles: styles.join('\n'), body, scripts, externalScripts, title };
}

function fixAssetPaths(html) {
  return html
    .replace(/href="css\//g, 'href="/css/')
    .replace(/src="js\//g, 'src="/js/')
    .replace(/src="(chair|bedroom|living-room|dining-room|outdoor)\//g, 'src="/$1/')
    .replace(/href="index\.html/g, 'href="/')
    .replace(/href="products\.html/g, 'href="/products')
    .replace(/href="categories\.html/g, 'href="/categories')
    .replace(/href="cart\.html/g, 'href="/cart')
    .replace(/href="checkout\.html/g, 'href="/checkout')
    .replace(/href="login\.html/g, 'href="/login')
    .replace(/href="register\.html/g, 'href="/register')
    .replace(/href="profile\.html/g, 'href="/profile')
    .replace(/href="track-order\.html/g, 'href="/track-order')
    .replace(/href="admin\.html/g, 'href="/admin');
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-legacy-src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src.startsWith('http') ? src : src.startsWith('/') ? src : `/${src}`;
    script.dataset.legacySrc = src;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function setupAuthGlobals(navigate) {
  window.togglePasswordVisibility = togglePasswordVisibility;
  window.showTopFloatNotification = showTopFloatNotification;
  window.showAlert = showAlert;
  window.showModalError = showModalError;
  window.__reactNavigate = navigate;
}

export default function LegacyPageRenderer({ html, pageKey }) {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { styles, body, scripts, externalScripts, title } = extractPageParts(html);

  useEffect(() => {
    document.title = title;
    initializeLocalStorage();
    setupAuthGlobals(navigate);
  }, [title, navigate]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleClick = (e) => {
      const anchor = e.target.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      const route = resolveRoute(href);
      if (route) {
        e.preventDefault();
        navigate(route);
      }
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [navigate, pageKey]);

  useEffect(() => {
    let cancelled = false;

    async function initPage() {
      const needsWishlist = ['home', 'products', 'categories', 'cart', 'checkout', 'track-order'].includes(pageKey);

      try {
        await loadScript('/js/auth.js');
        if (needsWishlist) await loadScript('/js/wishlist-modal.js');
      } catch (err) {
        console.warn('Failed to load legacy script:', err);
      }

      if (cancelled) return;

      scripts.forEach((scriptContent) => {
        try {
          const fn = new Function('navigate', scriptContent);
          fn(navigate);
        } catch (err) {
          try {
            const fn = new Function(scriptContent);
            fn();
          } catch (err2) {
            console.warn(`Legacy inline script error on ${pageKey}:`, err2);
          }
        }
      });

      if (pageKey === 'profile' && typeof window.initProfilePage === 'function') {
        window.initProfilePage();
      }

      if (typeof window.updateUserIcon === 'function') window.updateUserIcon();
      if (typeof window.updateCartCount === 'function') window.updateCartCount();
    }

    const timer = setTimeout(initPage, 50);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [scripts, externalScripts, pageKey, location.pathname, navigate]);

  return (
    <>
      {styles && <style dangerouslySetInnerHTML={{ __html: styles }} />}
      <div
        ref={containerRef}
        className={`legacy-page legacy-${pageKey}`}
        dangerouslySetInnerHTML={{ __html: fixAssetPaths(body) }}
      />
    </>
  );
}
