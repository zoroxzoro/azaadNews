import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import ArticleActionsMenu from './ArticleActionsMenu';
import { ExternalLink, Edit } from 'lucide-react';

export default function ArticleManagementTable({
  articles = [],
  selectedIds = [],
  onToggleSelect,
  onSelectAllVisible,
  isAllVisibleSelected = false,
  onStatusChange,
  onDeleteRequest,
}) {
  return (
    <div className="bg-paper-canvas border border-border-rule shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left font-inter text-xs min-w-[760px] border-collapse">
          {/* Table Header */}
          <thead className="bg-paper-tint border-b border-border-rule text-secondary uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th className="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllVisibleSelected && articles.length > 0}
                  onChange={onSelectAllVisible}
                  className="w-4 h-4 accent-primary-container cursor-pointer"
                  aria-label="दृश्यमान सभी आलेख चुनें"
                />
              </th>
              <th className="py-3 px-2 w-14">मीडिया</th>
              <th className="py-3 px-3">समाचार शीर्षक एवं स्लग</th>
              <th className="py-3 px-3 w-28">श्रेणी</th>
              <th className="py-3 px-3 w-32">लेखक / ब्यूरो</th>
              <th className="py-3 px-2 w-16 text-center">भाषा</th>
              <th className="py-3 px-3 w-32">स्थिति</th>
              <th className="py-3 px-3 w-28">अंतिम अपडेट</th>
              <th className="py-3 px-3 w-16 text-center">कार्रवाई</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-border-rule/80">
            {articles.length === 0 ? (
              <tr>
                <td colSpan="9" className="py-12 text-center text-secondary font-mukta text-sm">
                  कोई समाचार आलेख नहीं मिला।
                </td>
              </tr>
            ) : (
              articles.map((item) => {
                const isSelected = selectedIds.includes(item.id);

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-ticker-tint/30 hover:bg-ticker-tint/50'
                        : 'hover:bg-paper-tint/70'
                    }`}
                  >
                    {/* Row Checkbox */}
                    <td className="py-3 px-3 text-center align-middle">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(item.id)}
                        className="w-4 h-4 accent-primary-container cursor-pointer"
                        aria-label={`चुनें: ${item.title}`}
                      />
                    </td>

                    {/* Thumbnail */}
                    <td className="py-3 px-2 align-middle">
                      <div className="w-12 h-9 bg-surface-container overflow-hidden shrink-0 border border-border-rule">
                        <img
                          src={item.featuredImage}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>

                    {/* Title & Slug */}
                    <td className="py-3 px-3 align-middle max-w-xs sm:max-w-md">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-mono text-[10px] text-secondary">
                          ID: #{item.id}
                        </span>
                        {item.isBreaking && (
                          <span className="px-1.5 py-0.2 bg-ticker-tint text-breaking-crimson text-[9px] font-bold uppercase">
                            ब्रेकिंग
                          </span>
                        )}
                      </div>
                      <Link
                        to={`/admin/news/edit/${item.id}`}
                        className="font-mukta text-sm sm:text-base font-bold text-on-surface hover:text-primary-container line-clamp-1 leading-snug transition-colors"
                      >
                        {item.title}
                      </Link>
                      <span className="font-mono text-[10px] text-secondary block truncate">
                        slug: /{item.slug}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 align-middle">
                      <span className="px-2 py-0.5 bg-paper-subtle text-[10px] font-bold uppercase tracking-wider text-secondary border border-border-rule whitespace-nowrap">
                        {item.categoryNameHindi || item.category}
                      </span>
                    </td>

                    {/* Author */}
                    <td className="py-3 px-3 align-middle">
                      <span className="font-bold text-on-surface block truncate">
                        {item.author?.name || 'आज़ाद ब्यूरो'}
                      </span>
                      <span className="text-[10px] text-secondary block truncate">
                        {item.author?.location || 'कानपुर'}
                      </span>
                    </td>

                    {/* Language */}
                    <td className="py-3 px-2 align-middle text-center">
                      <span className="px-1.5 py-0.5 bg-paper-tint font-mono text-[10px] font-bold uppercase text-secondary border border-border-rule">
                        {item.language ? item.language.toUpperCase() : 'HI'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 align-middle whitespace-nowrap">
                      <StatusBadge status={item.status} />
                    </td>

                    {/* Last Updated */}
                    <td className="py-3 px-3 align-middle font-inter text-[11px] text-secondary whitespace-nowrap">
                      {item.updatedAt
                        ? new Date(item.updatedAt).toLocaleDateString('hi-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'हाल ही में'}
                    </td>

                    {/* Action Dropdown Menu */}
                    <td className="py-3 px-3 align-middle text-center">
                      <ArticleActionsMenu
                        article={item}
                        onStatusChange={onStatusChange}
                        onDeleteRequest={onDeleteRequest}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
