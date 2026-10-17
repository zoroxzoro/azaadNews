import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, MapPin } from 'lucide-react';
import SectionHeading from '../common/SectionHeading';

const UP_CITIES = [
  { key: 'all', label: 'सभी ज़िले' },
  { key: 'lucknow', label: 'लखनऊ' },
  { key: 'ayodhya', label: 'अयोध्या' },
  { key: 'varanasi', label: 'वाराणसी' },
  { key: 'kanpur', label: 'कानपुर' },
  { key: 'prayagraj', label: 'प्रयागराज' },
  { key: 'gorakhpur', label: 'गोरखपुर' },
];

/**
 * UPRegionalSection component
 * Interactive city-filtered Uttar Pradesh regional news showcase
 */
export default function UPRegionalSection({ articles = [], className = '' }) {
  const [activeCity, setActiveCity] = useState('all');

  const filteredArticles = activeCity === 'all'
    ? articles
    : articles.filter((a) => a.city === activeCity);

  const displayArticles = filteredArticles.length > 0 ? filteredArticles : articles;
  const leadUPStory = displayArticles[0];
  const secondaryUPStories = displayArticles.slice(1, 4);

  return (
    <section className={`bg-paper-canvas p-3 sm:p-5 lg:p-6 border border-border-rule transition-colors shadow-xs ${className}`}>
      {/* Header with City Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-border-heavy pb-2.5 mb-4 gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 bg-primary-container inline-block shrink-0"></span>
          <div>
            <h2 className="font-mukta text-xl md:text-2xl font-bold text-on-surface leading-tight">
              उत्तर प्रदेश विशेष • प्रादेशिक महाकवरेज
            </h2>
          </div>
        </div>

        <Link
          to="/category/uttar-pradesh"
          className="inline-flex items-center gap-1 font-inter text-xs font-bold text-primary-container hover:text-primary transition-colors group shrink-0"
        >
          <span>सभी 75 जिलों की खबरें</span>
          <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* City Switcher Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none text-xs font-inter">
        {UP_CITIES.map((city) => {
          const isActive = activeCity === city.key;
          return (
            <button
              key={city.key}
              type="button"
              onClick={() => setActiveCity(city.key)}
              className={`px-3 py-1 font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-primary-container text-white shadow-xs'
                  : 'bg-paper-tint text-on-surface hover:bg-surface-container border border-border-rule'
              }`}
            >
              {city.label}
            </button>
          );
        })}
      </div>

      {/* Grid: 1 Big Horizontal / Dominant Story + 3 Supporting Stories */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Dominant Story (6 Cols) */}
        {leadUPStory && (
          <article className="lg:col-span-6 bg-paper-tint p-3 sm:p-4 border border-border-rule flex flex-col justify-between group">
            <div>
              <div className="aspect-[16/10] overflow-hidden mb-3 relative bg-surface-container">
                <img
                  src={leadUPStory.featuredImage}
                  alt={leadUPStory.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-[#10264B] text-white text-[10px] font-inter uppercase font-bold px-2 py-0.5">
                  <MapPin className="w-3 h-3" />
                  <span>{leadUPStory.author?.location || 'उत्तर प्रदेश'}</span>
                </div>
              </div>

              <Link to={`/news/${leadUPStory.slug}`}>
                <h3 className="font-mukta text-base sm:text-lg lg:text-xl font-bold text-on-surface group-hover:text-primary-container transition-colors leading-snug">
                  {leadUPStory.title}
                </h3>
              </Link>

              {leadUPStory.summary && (
                <p className="font-inter text-xs sm:text-sm text-secondary mt-2 line-clamp-3 leading-relaxed">
                  {leadUPStory.summary}
                </p>
              )}
            </div>

            <div className="mt-4 pt-2.5 border-t border-border-rule flex items-center justify-between font-inter text-xs text-secondary">
              <span className="font-medium text-on-surface/90">
                {leadUPStory.author?.name || 'राज्य ब्यूरो प्रमुख'}
              </span>
              <span>{leadUPStory.readTime || '4 मिनट'}</span>
            </div>
          </article>
        )}

        {/* 3 Supporting City Stories (6 Cols) */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3.5">
          {secondaryUPStories.map((story) => (
            <article
              key={story.id}
              className="bg-paper-tint p-3 border border-border-rule flex gap-3 group items-center"
            >
              <div className="w-24 sm:w-28 aspect-[16/10] bg-surface-container shrink-0 overflow-hidden relative">
                <img
                  src={story.featuredImage}
                  alt={story.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute bottom-1 left-1 bg-black/75 text-white text-[8px] font-inter px-1 py-0.2">
                  {story.author?.location || 'यूपी'}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <Link to={`/news/${story.slug}`}>
                  <h4 className="font-mukta text-xs sm:text-sm font-bold text-on-surface group-hover:text-primary-container transition-colors line-clamp-2 leading-snug">
                    {story.title}
                  </h4>
                </Link>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-secondary font-inter">
                  <span className="text-primary-container font-semibold">
                    {story.author?.name || 'संवाददाता'}
                  </span>
                  <span>•</span>
                  <span>{story.readTime || '3 मिनट'}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
