import React from 'react';
import { Link } from 'react-router-dom';
import Container from '../../components/common/Container';
import { FileQuestion } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <Container className="py-16 text-center">
      <div className="max-w-md mx-auto bg-paper-canvas p-8 border border-border-rule">
        <div className="w-16 h-16 mx-auto mb-4 bg-paper-tint text-primary-container flex items-center justify-center">
          <FileQuestion className="w-8 h-8" />
        </div>
        <span className="font-inter text-xs uppercase font-bold text-secondary tracking-widest block mb-1">
          त्रुटि 404 (Page Not Found)
        </span>
        <h1 className="font-mukta text-2xl md:text-3xl font-extrabold text-on-surface mb-3">
          पृष्ठ उपलब्ध नहीं है
        </h1>
        <p className="font-inter text-xs text-secondary leading-relaxed mb-6">
          यह पृष्ठ हटा दिया गया है या इसका पता बदल दिया गया है। कृपया मुख्य समाचार पृष्ठ पर वापस जाएं।
        </p>
        <Link
          to="/"
          className="inline-block px-5 py-2.5 bg-primary-container text-white font-mukta font-bold text-sm hover:bg-primary transition-colors"
        >
          मुख्य पृष्ठ पर जाएं (Go to Homepage)
        </Link>
      </div>
    </Container>
  );
}
