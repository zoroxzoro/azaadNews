import { useEffect } from 'react';
import {
  applySEO,
  generateNewsArticleSchema,
  generatePortalOrganizationSchema,
  buildCanonicalUrl,
} from '../../services/seoService.js';

/**
 * Reusable SEO Component for Azaad Samachar
 * Injects meta tags, OpenGraph, Twitter Cards, and Schema.org JSON-LD structured data.
 */
export default function SEO({
  title,
  description,
  path = '',
  canonicalUrl,
  image,
  type = 'website',
  article = null,
  noIndex = false,
}) {
  const finalCanonical = canonicalUrl || buildCanonicalUrl(path);

  useEffect(() => {
    applySEO({
      title,
      description,
      canonicalUrl: finalCanonical,
      ogImage: image || article?.featuredImage,
      ogType: type,
      publishedAt: article?.publishedAt,
      modifiedAt: article?.updatedAt,
      authorName: article?.author?.name,
      section: article?.category,
      noIndex,
    });
  }, [title, description, finalCanonical, image, type, article, noIndex]);

  // Schema.org Structured Data
  let schemaData = null;
  if (article) {
    schemaData = generateNewsArticleSchema(article);
  } else if (path === '' || path === '/') {
    schemaData = generatePortalOrganizationSchema();
  }

  if (!schemaData) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}
