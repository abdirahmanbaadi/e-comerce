import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initAdminDataBridge } from './adminDataBridge.js';

function patchLegacyLinks(navigate) {
  document.querySelectorAll('a[href^="/"]').forEach((anchor) => {
    if (anchor.dataset.legacyPatched === 'true') return;
    anchor.dataset.legacyPatched = 'true';
    anchor.addEventListener('click', (event) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#' || anchor.target === '_blank') return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      navigate(href);
    });
  });
}

export function useAdminPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(Boolean(window.__adminPageLogicInit));

  useEffect(() => {
    initAdminDataBridge();
    patchLegacyLinks(navigate);
    setReady(true);
  }, [navigate]);

  return { ready };
}
