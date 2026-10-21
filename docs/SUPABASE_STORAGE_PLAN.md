# Supabase Storage Architecture & Security Plan: Azaad Samachar

## 1. Storage Overview

Azaad Samachar requires high-performance, globally distributed asset delivery for editorial news photographs, reporter avatars, category banners, and e-paper PDFs.

### Target Bucket Configuration
- **Primary Bucket:** `news-media`
- **Access Level:** **Public Read** (for CDN caching and web visitor delivery)
- **Upload Access:** **Strictly Authenticated Editorial Staff Only** (Editors, Admins, Authors)
- **Anonymous Uploads:** **Completely Disabled (Denied)**

---

## 2. Directory Hierarchy & Path Naming Conventions

To prevent namespace collisions, directory bloating, and filename injection vulnerabilities, direct original client filenames will never be used as raw storage keys.

```
news-media/
  ├── articles/
  │   └── YYYY/
  │       └── MM/
  │           └── {uuid}.{ext}           # Web-optimized editorial photography
  ├── thumbnails/
  │   └── YYYY/
  │       └── MM/
  │           └── {uuid}_thumb.{ext}     # Auto-generated 400px cards
  ├── avatars/
  │   └── {user_id}/{uuid}.{ext}         # Reporter/Editor profile avatars
  ├── epaper/
  │   └── YYYY/
  │       └── MM/
  │           └── DD_{uuid}.pdf          # Daily digital edition PDFs
  └── legacy-wp/
      └── wp-content/uploads/            # Reconciled historical WordPress images
```

---

## 3. Upload Constraints & Validation Rules

### 3.1 Allowed MIME Types
| Category | Allowed Formats | Max File Size |
| :--- | :--- | :--- |
| **News Photos** | `image/jpeg`, `image/png`, `image/webp`, `image/avif` | 5 MB |
| **Vector Graphics** | `image/svg+xml` | 1 MB |
| **Digital E-Paper** | `application/pdf` | 50 MB |

### 3.2 Client-Side Sanitization & Pre-Processing
Before upload:
1. Strip hazardous EXIF GPS and device tracking metadata to protect reporter privacy.
2. Generate client-side thumbnail for immediate responsive preview.
3. Validate magic bytes to verify MIME type integrity.

---

## 4. Supabase Storage Row Level Security (RLS) Policies

Supabase manages storage bucket objects through `storage.objects` table. The storage policies enforce:

```sql
-- 1. Public Read Access: Anyone can view images in the 'news-media' bucket
CREATE POLICY "Public Read Access for News Media"
ON storage.objects FOR SELECT
USING (bucket_id = 'news-media');

-- 2. Authenticated Editorial Upload: Only logged-in authors/editors/admins can upload
CREATE POLICY "Editorial Staff Upload Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'news-media'
  AND (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'webp', 'avif', 'svg', 'pdf'))
  AND auth.role() = 'authenticated'
);

-- 3. Update & Modify: Allowed only for file owner or admin/editor
CREATE POLICY "Editorial Staff Update Access"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'news-media'
  AND (owner = auth.uid() OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin', 'editor'))
);

-- 4. Delete: Strictly restricted to Admins and Super Admins
CREATE POLICY "Admin Only Media Deletion"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'news-media'
  AND public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
);
```

---

## 5. Metadata Integration & Database Tracking

Every file uploaded to `news-media` generates a corresponding record in `public.media`:

```sql
INSERT INTO public.media (
  id,
  storage_bucket,
  storage_path,
  public_url,
  thumbnail_url,
  original_filename,
  mime_type,
  file_size,
  width,
  height,
  alt_text,
  caption,
  credit,
  uploaded_by
) VALUES (
  gen_random_uuid(),
  'news-media',
  'articles/2026/10/89af8c64-77db-4df9-a9a3-1a073f1dcb89.webp',
  'https://[project-ref].supabase.co/storage/v1/object/public/news-media/articles/2026/10/89af8c64-77db-4df9-a9a3-1a073f1dcb89.webp',
  'https://[project-ref].supabase.co/storage/v1/object/public/news-media/thumbnails/2026/10/89af8c64-77db-4df9-a9a3-1a073f1dcb89_thumb.webp',
  'parliament-session.jpg',
  'image/webp',
  245890,
  1200,
  800,
  'संसद भवन का दृश्य',
  'संसद के दोनों सदनों में औद्योगिक नीति सत्र',
  'पीटीआई / विशेष संवाददाता',
  auth.uid()
);
```

---

## 6. Legacy WordPress Media Migration Strategy

For historical WordPress media:
1. `public.media` will first be populated with metadata from MariaDB `wp_posts` (attachment records).
2. The initial `public_url` can retain the current domain/CDN origin or Hostinger legacy uploads path.
3. An offline Node.js reconciliation script will download validated assets and upload them into `news-media/legacy-wp/`, subsequently updating `public_url` and `storage_path` in batches.
4. Broken/missing legacy attachments will be flagged without halting publication.
