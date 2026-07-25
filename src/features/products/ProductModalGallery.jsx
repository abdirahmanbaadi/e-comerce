/**
 * Shared product modal image gallery — shop + admin product details
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { productImage } from '../../utils/format';

const SWIPE_THRESHOLD = 48;
const FALLBACK_IMAGE = 'product-images/hero1.jpeg';

/** Match shop product modal — padding, column gap, image dimensions */
export const PRODUCT_MODAL_BODY_CLASS = 'p-6';
export const PRODUCT_MODAL_HERO_ROW_CLASS = 'flex flex-col gap-4 md:flex-row';
export const PRODUCT_MODAL_GALLERY_COL_CLASS = 'w-full shrink-0 md:w-1/2';
export const PRODUCT_MODAL_DETAILS_COL_CLASS = 'w-full min-w-0 md:w-1/2';

export function ProductModalHeroRow({ gallery, details, className = '' }) {
  return (
    <div className={`${PRODUCT_MODAL_HERO_ROW_CLASS} ${className}`.trim()}>
      {gallery}
      {details}
    </div>
  );
}

export function ProductModalGallery({ images: rawImages, title, resetKey, className = '' }) {
  const images = useMemo(() => {
    const unique = [...new Set((rawImages || []).filter(Boolean))];
    return unique.length ? unique : [FALLBACK_IMAGE];
  }, [rawImages]);

  const [activeSlide, setActiveSlide] = useState(0);
  const swipeRef = useRef({ startX: 0, dragging: false });

  useEffect(() => {
    setActiveSlide(0);
  }, [resetKey, images.join('|')]);

  const goToSlide = (direction) => {
    if (images.length <= 1) return;
    setActiveSlide((current) => {
      if (direction < 0) return current > 0 ? current - 1 : images.length - 1;
      return current < images.length - 1 ? current + 1 : 0;
    });
  };

  const handleSwipeStart = (event) => {
    if (images.length <= 1) return;
    swipeRef.current = { startX: event.clientX, dragging: true };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleSwipeEnd = (event) => {
    if (!swipeRef.current.dragging || images.length <= 1) return;
    const delta = event.clientX - swipeRef.current.startX;
    swipeRef.current.dragging = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    goToSlide(delta > 0 ? -1 : 1);
  };

  const handleSwipeCancel = (event) => {
    swipeRef.current.dragging = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div className={`${PRODUCT_MODAL_GALLERY_COL_CLASS} ${className}`.trim()}>
      <div className="mb-3 h-[300px] overflow-hidden rounded-[14px] border border-black/[0.05] bg-white md:h-[390px]">
        <div
          className={`relative h-full touch-pan-y select-none ${images.length > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
          onPointerDown={handleSwipeStart}
          onPointerUp={handleSwipeEnd}
          onPointerCancel={handleSwipeCancel}
          role={images.length > 1 ? 'region' : undefined}
          aria-label={images.length > 1 ? 'Product images. Swipe or drag to change image.' : undefined}
        >
          {images.map((img, index) => (
            <div
              key={`${img}-${index}`}
              className={`absolute inset-0 transition-opacity duration-200 ${
                index === activeSlide ? 'z-[1] opacity-100' : 'z-0 opacity-0 pointer-events-none'
              }`}
            >
              <img
                src={productImage(img)}
                alt={`${title} — image ${index + 1}`}
                className="block h-full w-full object-cover"
                draggable={false}
                loading={index <= 1 ? 'eager' : 'lazy'}
                onError={(e) => {
                  e.currentTarget.src = productImage(FALLBACK_IMAGE);
                }}
              />
            </div>
          ))}

          {images.length > 1 && (
            <>
              <button
                type="button"
                className="absolute left-3 top-1/2 z-[2] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-white/90 text-deepGreen shadow-md transition hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  goToSlide(-1);
                }}
                aria-label="Previous image"
              >
                <i className="fa-solid fa-chevron-left" />
              </button>
              <button
                type="button"
                className="absolute right-3 top-1/2 z-[2] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-white/90 text-deepGreen shadow-md transition hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  goToSlide(1);
                }}
                aria-label="Next image"
              >
                <i className="fa-solid fa-chevron-right" />
              </button>
              <div className="pointer-events-none absolute bottom-3 left-1/2 z-[2] flex -translate-x-1/2 gap-1.5">
                {images.map((img, index) => (
                  <span
                    key={`dot-${img}-${index}`}
                    className={`h-1.5 rounded-full transition-all ${index === activeSlide ? 'w-5 bg-white' : 'w-1.5 bg-white/55'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {images.map((img, index) => (
          <button
            key={`thumb-${img}-${index}`}
            type="button"
            className={`h-[74px] w-[74px] cursor-pointer overflow-hidden rounded-lg border-2 bg-white p-0 transition-colors ${
              index === activeSlide ? 'border-deepGreen' : 'border-transparent hover:border-deepGreen'
            }`}
            onClick={() => setActiveSlide(index)}
          >
            <img
              src={productImage(img)}
              alt=""
              className="block h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.src = productImage(FALLBACK_IMAGE);
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function ProductModalSpecsTable({ material, color, dimensions, availability, inStock }) {
  const rows = [
    { icon: 'fa-couch', label: 'Material', value: material },
    { icon: 'fa-palette', label: 'Color', value: color },
    dimensions?.trim() ? { icon: 'fa-ruler-combined', label: 'Dimensions', value: dimensions.trim() } : null,
    {
      icon: 'fa-circle-check',
      label: 'Availability',
      value: availability,
      stockClass: inStock ? 'font-extrabold text-[#087443]' : 'font-extrabold text-[#b42318]',
    },
  ].filter(Boolean);

  return (
    <table className="mb-[18px] mt-2.5 w-full border-collapse text-[0.88rem]">
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <td className="w-[125px] py-1.5 align-middle font-extrabold text-[#111111] [.admin-dark_&]:text-gray-100">
              <i className={`fa-solid ${row.icon} mr-1.5 w-4 text-deepGreen`} />
              {row.label}
            </td>
            <td className={`py-1.5 align-middle text-[#444444] [.admin-dark_&]:text-gray-300 ${row.stockClass || ''}`}>
              {row.value || '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
