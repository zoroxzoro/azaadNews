import React from 'react';
import { Link } from 'react-router-dom';
import Container from '../../components/common/Container';
import SEO from '../../components/common/SEO.jsx';
import { Home, Search, Newspaper, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="bg-paper-canvas min-h-[70vh] py-16 flex items-center justify-center">
      <SEO
        title="पृष्ठ नहीं मिला (404 Page Not Found)"
        description="अनुरोधित पृष्ठ आज़ाद समाचार डिजिटल पोर्टल पर उपलब्ध नहीं है।"
        noIndex={true}
      />
      <Container className="px-4 text-center">
        <div className="max-w-lg mx-auto bg-paper-canvas border border-border-rule p-8 sm:p-10 shadow-xs space-y-5">
          {/* Broadsheet 404 Badge */}
          <div className="w-16 h-16 mx-auto rounded-full bg-ticker-tint text-primary-container flex items-center justify-center font-mukta text-3xl font-extrabold shadow-2xs">
            ४०४
          </div>

          <div className="space-y-1">
            <span className="font-inter text-xs uppercase font-bold text-breaking-crimson tracking-widest block">
              त्रुटि ४०४ • पृष्ठ उपलब्ध नहीं है (PAGE NOT FOUND)
            </span>
            <h1 className="font-mukta text-2xl sm:text-3xl font-bold text-on-surface">
              अनुरोधित पृष्ठ नहीं मिला
            </h1>
          </div>

          <p className="font-inter text-xs sm:text-sm text-secondary leading-relaxed max-w-md mx-auto">
            आपके द्वारा खोजा गया वेब पृष्ठ या तो हटा दिया गया है, उसका पता बदल दिया गया है, अथवा यह अस्थायी रूप से अनुपलब्ध है।
          </p>

          {/* Quick Helpful Navigation Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-container text-white font-mukta font-bold text-sm hover:bg-primary transition-colors shadow-xs"
            >
              <Home className="w-4 h-4" />
              <span>मुख्य पृष्ठ पर जाएं</span>
            </Link>
            <Link
              to="/category/latest"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-paper-tint border border-border-heavy text-on-surface font-mukta font-bold text-sm hover:bg-surface-container transition-colors"
            >
              <Newspaper className="w-4 h-4 text-primary-container" />
              <span>ताज़ा खबरें</span>
            </Link>
            <Link
              to="/search"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-paper-tint border border-border-heavy text-on-surface font-mukta font-bold text-sm hover:bg-surface-container transition-colors"
            >
              <Search className="w-4 h-4 text-secondary" />
              <span>अभिलेखागार खोजें</span>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
