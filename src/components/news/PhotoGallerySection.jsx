import React from 'react';
import { Camera } from 'lucide-react';
import { Link } from 'react-router-dom';

const GALLERY_ITEMS = [
  {
    id: 1,
    title: 'हिमालय के शिखरों पर वसंत की पहली किरण: बद्रीनाथ धाम में बर्फ पिघलने का मनोरम दृश्य',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    count: '8 फोटो',
    slug: 'himalayan-peaks-badrinath-spring-photo-story',
  },
  {
    id: 2,
    title: 'इसरो का नया कीर्तिमान: श्रीहरिकोटा से नए मौसम उपग्रह के सफल प्रक्षेपण की अद्भुत झलकियां',
    image: 'https://images.unsplash.com/photo-1517976487502-5f6902264b38?auto=format&fit=crop&w=800&q=80',
    count: '14 फोटो',
    slug: 'isro-sriharikota-satellite-launch-photo-story',
  },
  {
    id: 3,
    title: 'रंग, उमंग और संस्कृति: देश के विभिन्न हिस्सों में पारंपरिक लोक नृत्यों का भव्य उत्सव',
    image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80',
    count: '10 फोटो',
    slug: 'traditional-folk-dance-cultural-fest-photo-story',
  },
  {
    id: 4,
    title: 'वंदे भारत 3.0: स्लीपर कोच वाली नई ट्रेन की आंतरिक विलासिता और तकनीकी खूबियां',
    image: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
    count: '6 फोटो',
    slug: 'vande-bharat-sleeper-coach-luxury-features-photo-story',
  },
];

/**
 * PhotoGallerySection component
 * High-visual photo story showcase with camera icon overlays
 */
export default function PhotoGallerySection({ className = '' }) {
  return (
    <section className={`w-full bg-paper-canvas p-4 sm:p-5 lg:p-6 shadow-xs border border-border-rule ${className}`}>
      <div className="flex items-center justify-between border-b-2 border-border-heavy pb-2 mb-4">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary-container" />
          <h2 className="font-mukta text-lg sm:text-xl font-bold text-on-surface">
            फोटो गैलरी • तस्वीरों में आज का भारत
          </h2>
        </div>
        <span className="font-inter text-xs text-secondary font-medium">
          दैनिक विजुअल डायरी
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {GALLERY_ITEMS.map((item) => (
          <Link
            key={item.id}
            to={`/news/${item.slug}`}
            className="flex flex-col group cursor-pointer"
          >
            <div className="overflow-hidden aspect-video bg-surface-container relative">
              <img
                src={item.image}
                alt={item.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute bottom-2 left-2 bg-black/80 text-white font-inter text-[11px] px-2 py-0.5 flex items-center gap-1 shadow-xs">
                <Camera className="w-3 h-3 text-primary-container" />
                <span>{item.count}</span>
              </span>
            </div>
            <h4 className="font-mukta text-xs sm:text-sm font-bold text-on-surface group-hover:text-primary-container transition-colors mt-2 leading-snug line-clamp-2">
              {item.title}
            </h4>
          </Link>
        ))}
      </div>
    </section>
  );
}
