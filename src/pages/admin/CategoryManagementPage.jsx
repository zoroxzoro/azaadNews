import React from 'react';
import { categories } from '../../data/categories';
import { FolderTree, Plus, Edit2 } from 'lucide-react';

export default function CategoryManagementPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-paper-canvas p-4 sm:p-5 border border-border-rule flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="font-mukta text-xl sm:text-2xl font-extrabold text-on-surface">
            श्रेणी प्रबंधन (Category Management)
          </h1>
          <p className="font-inter text-xs text-secondary mt-0.5">
            वेबसाइट एवं ई-पेपर के लिए सक्रिय श्रेणियों का संपादन एवं प्राथमिकता क्रम।
          </p>
        </div>

        <button
          onClick={() => alert('नई श्रेणी जोड़ने का फॉर्म अगले चरण में सक्रिय होगा।')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-primary-container text-white font-mukta font-bold text-xs sm:text-sm hover:bg-primary transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>नई श्रेणी जोड़ें</span>
        </button>
      </div>

      <div className="bg-paper-canvas border border-border-rule overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left font-inter text-xs min-w-[500px]">
            <thead className="bg-paper-tint border-b border-border-rule text-secondary uppercase text-[10px] font-bold">
              <tr>
                <th className="py-2.5 px-3 sm:px-4">नाम (हिंदी)</th>
                <th className="py-2.5 px-3 sm:px-4">Name (English)</th>
                <th className="py-2.5 px-3 sm:px-4">स्लग (Slug)</th>
                <th className="py-2.5 px-3 sm:px-4">प्रकार (Type)</th>
                <th className="py-2.5 px-3 sm:px-4 text-right">कार्रवाई</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-rule">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-paper-tint transition-colors">
                  <td className="py-3 px-3 sm:px-4 font-mukta font-bold text-sm sm:text-base text-on-surface">
                    {cat.nameHindi}
                  </td>
                  <td className="py-3 px-3 sm:px-4 text-secondary">{cat.nameEnglish}</td>
                  <td className="py-3 px-3 sm:px-4 font-mono text-[10px] sm:text-[11px] text-secondary">
                    /category/{cat.slug}
                  </td>
                  <td className="py-3 px-3 sm:px-4">
                    {cat.isPrimary ? (
                      <span className="bg-primary-container/10 text-primary-container px-2 py-0.5 font-bold uppercase text-[9px] sm:text-[10px]">
                        मुख्य (Primary)
                      </span>
                    ) : (
                      <span className="bg-paper-subtle text-secondary px-2 py-0.5 uppercase text-[9px] sm:text-[10px]">
                        अन्य
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 sm:px-4 text-right">
                    <button className="text-secondary hover:text-primary-container p-1 cursor-pointer">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
