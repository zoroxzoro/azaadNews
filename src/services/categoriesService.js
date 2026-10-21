/**
 * Categories Service & Supabase Adapter Layer
 * Azaad Samachar (आज़ाद समाचार)
 *
 * Full CRUD support for Category Management & taxonomy integration with Supabase.
 * Respects Row Level Security (RLS) policies.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { categories as mockCategories } from '../data/categories.js';

/**
 * Maps Supabase category row to frontend category object
 */
export function adaptSupabaseCategoryToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    uuid: row.id,
    slug: row.slug,
    nameHindi: row.name,
    nameEnglish: row.english_name || row.slug,
    description: row.description || '',
    color: row.color || '#DA251D',
    icon: row.icon || null,
    parentId: row.parent_id || null,
    isPrimary: Boolean(row.is_primary),
    showInNavigation: Boolean(row.show_in_navigation),
    displayOrder: row.display_order || 0,
    isActive: Boolean(row.is_active),
    legacyWordPressTermId: row.legacy_wordpress_term_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Maps frontend category to Supabase insert/update payload
 */
export function adaptFrontendCategoryToSupabase(cat) {
  return {
    name: cat.nameHindi || cat.name,
    slug: cat.slug,
    english_name: cat.nameEnglish || cat.slug,
    description: cat.description || '',
    color: cat.color || '#DA251D',
    icon: cat.icon || null,
    parent_id: cat.parentId || null,
    is_primary: Boolean(cat.isPrimary),
    show_in_navigation: cat.showInNavigation !== undefined ? Boolean(cat.showInNavigation) : true,
    is_active: cat.isActive !== undefined ? Boolean(cat.isActive) : true,
    display_order: cat.displayOrder || cat.order || 0,
  };
}

export const categoriesService = {
  /**
   * Fetch active categories for public navigation & dropdowns
   */
  async getCategories() {
    if (!isSupabaseConfigured) {
      return mockCategories;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error || !data || data.length === 0) {
        return mockCategories;
      }

      return data.map(adaptSupabaseCategoryToFrontend);
    } catch (err) {
      console.warn('[categoriesService] Supabase getCategories fallback:', err);
      return mockCategories;
    }
  },

  /**
   * Fetch all categories for Admin Category Management (including inactive)
   */
  async getAllCategories() {
    if (!isSupabaseConfigured) {
      return mockCategories;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error || !data || data.length === 0) {
        return mockCategories;
      }

      return data.map(adaptSupabaseCategoryToFrontend);
    } catch (err) {
      console.warn('[categoriesService] Supabase getAllCategories fallback:', err);
      return mockCategories;
    }
  },

  /**
   * Fetch a single category by slug
   */
  async getCategoryBySlug(slug) {
    if (!isSupabaseConfigured) {
      return mockCategories.find((c) => c.slug === slug) || null;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error || !data) {
        return mockCategories.find((c) => c.slug === slug) || null;
      }

      return adaptSupabaseCategoryToFrontend(data);
    } catch (err) {
      console.warn('[categoriesService] Error querying category by slug:', err);
      return mockCategories.find((c) => c.slug === slug) || null;
    }
  },

  /**
   * Create a new category (Admin only)
   */
  async createCategory(categoryData) {
    if (!isSupabaseConfigured) {
      const newCat = {
        ...categoryData,
        id: categoryData.slug,
        isPrimary: Boolean(categoryData.isPrimary),
      };
      mockCategories.push(newCat);
      return { success: true, data: newCat };
    }

    try {
      const payload = adaptFrontendCategoryToSupabase(categoryData);
      const { data, error } = await supabase
        .from('categories')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: adaptSupabaseCategoryToFrontend(data) };
    } catch (err) {
      console.error('[categoriesService] createCategory error:', err);
      return { success: false, error: err.message || 'श्रेणी बनाने में त्रुटि' };
    }
  },

  /**
   * Update category by ID or slug (Admin only)
   */
  async updateCategory(id, updates) {
    if (!isSupabaseConfigured) {
      const index = mockCategories.findIndex((c) => c.id === id || c.slug === id);
      if (index !== -1) {
        mockCategories[index] = { ...mockCategories[index], ...updates };
        return { success: true, data: mockCategories[index] };
      }
      return { success: false, error: 'Category not found' };
    }

    try {
      const payload = adaptFrontendCategoryToSupabase(updates);
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

      let query = supabase.from('categories').update(payload);
      if (isUUID) {
        query = query.eq('id', id);
      } else {
        query = query.eq('slug', id);
      }

      const { data, error } = await query.select().single();
      if (error) throw error;
      return { success: true, data: adaptSupabaseCategoryToFrontend(data) };
    } catch (err) {
      console.error('[categoriesService] updateCategory error:', err);
      return { success: false, error: err.message || 'श्रेणी अद्यतन में त्रुटि' };
    }
  },

  /**
   * Safe Delete: Check if any articles are linked before deleting
   */
  async deleteCategory(id) {
    if (!isSupabaseConfigured) {
      const index = mockCategories.findIndex((c) => c.id === id || c.slug === id);
      if (index !== -1) {
        mockCategories.splice(index, 1);
        return { success: true };
      }
      return { success: false, error: 'Category not found' };
    }

    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

      // 1. Resolve UUID
      let categoryId = id;
      if (!isUUID) {
        const { data: catRow } = await supabase.from('categories').select('id').eq('slug', id).maybeSingle();
        if (!catRow) return { success: false, error: 'श्रेणी नहीं मिली' };
        categoryId = catRow.id;
      }

      // 2. Safe check: Are there linked articles in article_categories?
      const { count, error: countError } = await supabase
        .from('article_categories')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId);

      if (!countError && count && count > 0) {
        return {
          success: false,
          error: `यह श्रेणी हटाई नहीं जा सकती क्योंकि इसके अंतर्गत ${count} समाचार आलेख संबद्ध हैं। पहले उन आलेखों की श्रेणी बदलें।`,
        };
      }

      // 3. Delete category
      const { error: delError } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (delError) throw delError;
      return { success: true };
    } catch (err) {
      console.error('[categoriesService] deleteCategory error:', err);
      return { success: false, error: err.message || 'श्रेणी हटाने में त्रुटि' };
    }
  },

  /**
   * Seed default categories into Supabase if table is empty (Admin only)
   */
  async seedDefaultCategories() {
    if (!isSupabaseConfigured) return;
    try {
      const { count } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true });

      if (count === 0) {
        const payload = mockCategories.map((c, idx) => ({
          name: c.nameHindi,
          slug: c.slug,
          english_name: c.nameEnglish,
          description: c.description,
          color: c.color,
          display_order: idx + 1,
          is_active: true,
          show_in_navigation: true,
          is_primary: Boolean(c.isPrimary),
        }));

        await supabase.from('categories').upsert(payload, { onConflict: 'slug' });
      }
    } catch (err) {
      console.warn('[categoriesService] seedDefaultCategories notice:', err.message);
    }
  },
};

export default categoriesService;
