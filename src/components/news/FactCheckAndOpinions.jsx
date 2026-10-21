import React from 'react';
import { Link } from 'react-router-dom';
import { Landmark, Globe, ChevronRight } from 'lucide-react';
import NewsCard from './NewsCard';
import CompactNewsCard from './CompactNewsCard';

/**
 * FactCheckAndOpinions component (Dual Editorial Spotlight)
 * Two-pillar editorial broadsheet row from Stitch:
 * - Left (6 Cols): Politics & Governance (राजनीति एवं सत्ता) - real articles from Supabase
 * - Right (6 Cols): World & International Diplomacy (दुनिया एवं अंतरराष्ट्रीय मंच) - real articles from Supabase
 *
 * Replaces hardcoded demo claims and fake author avatars with 100% genuine published articles.
 */
export default function FactCheckAndOpinions({
  politicsArticles = [],
  worldArticles = [],
  className = '',
}) {
  const leadPolitics = politicsArticles[0];
  const subPolitics = politicsArticles.slice(1, 3);

  const leadWorld = worldArticles[0];
  const subWorld = worldArticles.slice(1, 3);

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 items-start ${className}`}>
      {/* LEFT PILLAR: Politics & Governance (6 Cols) */}
      <section className="lg:col-span-6 bg-paper-canvas p-4 sm:p-5 shadow-xs border-t-4 border-primary-container flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border-rule pb-2">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-primary-container" />
            <h3 className="font-mukta text-lg sm:text-xl font-bold text-on-surface">
              राजनीति एवं प्रशासनिक हलचल
            </h3>
          </div>
          <Link
            to="/category/politics"
            className="text-primary-container font-inter text-xs font-bold hover:underline flex items-center gap-0.5"
          >
            <span>सभी राजनीतिक खबरें</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {leadPolitics ? (
          <div className="flex flex-col gap-3">
            <NewsCard article={leadPolitics} variant="horizontal" showSummary={true} />
            {subPolitics.length > 0 && (
              <div className="flex flex-col divide-y divide-border-rule border-t border-border-rule pt-2">
                {subPolitics.map((story) => (
                  <CompactNewsCard
                    key={story.id}
                    article={story}
                    showImage={Boolean(story.featuredImage)}
                    imagePosition="right"
                    imageSize="w-20 h-16"
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-paper-tint border border-dashed border-border-heavy p-6 text-center text-secondary font-mukta text-xs">
            राजनीतिक बुलेटिन लोड किया जा रहा है...
          </div>
        )}
      </section>

      {/* RIGHT PILLAR: World & International Affairs (6 Cols) */}
      <section className="lg:col-span-6 bg-paper-canvas p-4 sm:p-5 shadow-xs border-t-4 border-[#10264B] flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border-rule pb-2">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-on-surface" />
            <h3 className="font-mukta text-lg sm:text-xl font-bold text-on-surface">
              दुनिया • अंतरराष्ट्रीय परिदृश्य
            </h3>
          </div>
          <Link
            to="/category/world"
            className="text-primary-container font-inter text-xs font-bold hover:underline flex items-center gap-0.5"
          >
            <span>सभी अंतरराष्ट्रीय खबरें</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {leadWorld ? (
          <div className="flex flex-col gap-3">
            <NewsCard article={leadWorld} variant="horizontal" showSummary={true} />
            {subWorld.length > 0 && (
              <div className="flex flex-col divide-y divide-border-rule border-t border-border-rule pt-2">
                {subWorld.map((story) => (
                  <CompactNewsCard
                    key={story.id}
                    article={story}
                    showImage={Boolean(story.featuredImage)}
                    imagePosition="right"
                    imageSize="w-20 h-16"
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-paper-tint border border-dashed border-border-heavy p-6 text-center text-secondary font-mukta text-xs">
            विश्व समाचार बुलेटिन लोड किया जा रहा है...
          </div>
        )}
      </section>
    </div>
  );
}
