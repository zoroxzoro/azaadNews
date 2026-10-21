import React, { useState, useEffect, useCallback } from 'react';
import { categoriesService } from '../../services/categoriesService';
import { FolderTree, Plus, Edit2, Trash2, X, Check, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CategoryManagementPage() {
  const [categoriesList, setCategoriesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal / Form state for Add or Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    nameHindi: '',
    nameEnglish: '',
    slug: '',
    description: '',
    color: '#DA251D',
    displayOrder: 1,
    isPrimary: true,
    showInNavigation: true,
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch all categories from Supabase
  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await categoriesService.getAllCategories();
      setCategoriesList(data);
    } catch (err) {
      console.error(err);
      toast.error('श्रेणियां लोड करने में त्रुटि');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({
      nameHindi: '',
      nameEnglish: '',
      slug: '',
      description: '',
      color: '#DA251D',
      displayOrder: categoriesList.length + 1,
      isPrimary: false,
      showInNavigation: true,
      isActive: true,
    });
    setFormError('');
    setModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({
      nameHindi: cat.nameHindi || cat.name,
      nameEnglish: cat.nameEnglish || '',
      slug: cat.slug || '',
      description: cat.description || '',
      color: cat.color || '#DA251D',
      displayOrder: cat.displayOrder || cat.order || 1,
      isPrimary: Boolean(cat.isPrimary),
      showInNavigation: cat.showInNavigation !== undefined ? Boolean(cat.showInNavigation) : true,
      isActive: cat.isActive !== undefined ? Boolean(cat.isActive) : true,
    });
    setFormError('');
    setModalOpen(true);
  };

  // Submit Handler for Create / Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.nameHindi.trim()) {
      setFormError('श्रेणी का नाम (हिंदी) अनिवार्य है।');
      return;
    }
    if (!formData.slug.trim()) {
      setFormError('स्लग (Slug) अनिवार्य है।');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingCategory) {
        const idToUpdate = editingCategory.uuid || editingCategory.id;
        const result = await categoriesService.updateCategory(idToUpdate, formData);
        if (result.success) {
          toast.success('श्रेणी सफलतापूर्वक अद्यतन हुई');
          setModalOpen(false);
          await loadCategories();
        } else {
          setFormError(result.error);
        }
      } else {
        const result = await categoriesService.createCategory(formData);
        if (result.success) {
          toast.success('नई श्रेणी सफलतापूर्वक जोड़ी गई');
          setModalOpen(false);
          await loadCategories();
        } else {
          setFormError(result.error);
        }
      }
    } catch (err) {
      setFormError(err.message || 'त्रुटि हुई');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Category Handler
  const handleDelete = async (cat) => {
    const confirmMessage = `क्या आप श्रेणी "${cat.nameHindi || cat.name}" हटाना चाहते हैं?`;
    if (!window.confirm(confirmMessage)) return;

    try {
      const idToDelete = cat.uuid || cat.id;
      const result = await categoriesService.deleteCategory(idToDelete);
      if (result.success) {
        toast.success('श्रेणी सफलतापूर्वक हटाई गई');
        await loadCategories();
      } else {
        toast.error(result.error || 'श्रेणी हटाने में त्रुटि');
      }
    } catch (err) {
      toast.error(err.message || 'श्रेणी हटाने में त्रुटि');
    }
  };

  // Seed default categories into Supabase
  const handleSeedDefaults = async () => {
    try {
      toast.loading('डिफ़ॉल्ट श्रेणियां सिंक हो रही हैं...');
      await categoriesService.seedDefaultCategories();
      toast.dismiss();
      toast.success('डिफ़ॉल्ट श्रेणियां सफलतापूर्वक जोड़ी गईं');
      await loadCategories();
    } catch (err) {
      toast.dismiss();
      toast.error('सीडिंग में त्रुटि');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Bar */}
      <div className="bg-paper-canvas p-4 sm:p-5 border border-border-rule flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="font-mukta text-xl sm:text-2xl font-extrabold text-on-surface">
            श्रेणी प्रबंधन (Category Management)
          </h1>
          <p className="font-inter text-xs text-secondary mt-0.5">
            वेबसाइट एवं ई-पेपर के लिए सक्रिय श्रेणियों का संपादन, क्रम एवं प्राथमिकता।
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {categoriesList.length === 0 && (
            <button
              onClick={handleSeedDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper-tint border border-border-rule text-on-surface font-mukta font-bold text-xs sm:text-sm hover:bg-paper-subtle transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>डिफ़ॉल्ट श्रेणियां लोड करें</span>
            </button>
          )}

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-primary-container text-white font-mukta font-bold text-xs sm:text-sm hover:bg-primary transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>नई श्रेणी जोड़ें</span>
          </button>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-paper-canvas border border-border-rule overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs font-inter text-secondary">
            <div className="w-6 h-6 border-2 border-primary-container border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>श्रेणियां लोड हो रही हैं...</span>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left font-inter text-xs min-w-[600px]">
              <thead className="bg-paper-tint border-b border-border-rule text-secondary uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-3 sm:px-4">क्रम</th>
                  <th className="py-2.5 px-3 sm:px-4">नाम (हिंदी)</th>
                  <th className="py-2.5 px-3 sm:px-4">Name (English)</th>
                  <th className="py-2.5 px-3 sm:px-4">स्लग (Slug)</th>
                  <th className="py-2.5 px-3 sm:px-4">प्रकार (Type)</th>
                  <th className="py-2.5 px-3 sm:px-4">नेविगेशन</th>
                  <th className="py-2.5 px-3 sm:px-4 text-right">कार्रवाई</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-rule">
                {categoriesList.map((cat, idx) => (
                  <tr key={cat.uuid || cat.id || idx} className="hover:bg-paper-tint transition-colors">
                    <td className="py-3 px-3 sm:px-4 font-mono text-[11px] text-secondary">
                      {cat.displayOrder || idx + 1}
                    </td>
                    <td className="py-3 px-3 sm:px-4 font-mukta font-bold text-sm sm:text-base text-on-surface">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color || '#DA251D' }}
                        />
                        <span>{cat.nameHindi || cat.name}</span>
                      </div>
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
                    <td className="py-3 px-3 sm:px-4">
                      {cat.showInNavigation ? (
                        <span className="text-green-600 dark:text-green-400 font-bold text-[10px]">सक्रिय</span>
                      ) : (
                        <span className="text-secondary text-[10px]">छिपा हुआ</span>
                      )}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(cat)}
                          className="text-secondary hover:text-primary-container p-1 cursor-pointer"
                          title="संपादित करें"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          className="text-secondary hover:text-breaking-crimson p-1 cursor-pointer"
                          title="हटाएं"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL DIALOG */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-paper-canvas border border-border-rule w-full max-w-lg p-5 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border-rule pb-3 mb-4">
              <h3 className="font-mukta text-lg font-bold text-on-surface">
                {editingCategory ? 'श्रेणी संपादित करें (Edit Category)' : 'नई श्रेणी जोड़ें (Create Category)'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-secondary hover:text-on-surface cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-inter flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 font-inter text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-secondary mb-1">
                    नाम (हिंदी) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nameHindi}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        nameHindi: name,
                        slug: prev.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                      }));
                    }}
                    placeholder="उदा. उत्तर प्रदेश"
                    className="w-full px-3 py-2 bg-paper-tint border border-border-rule text-on-surface focus:outline-none focus:bg-paper-canvas font-mukta text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-secondary mb-1">
                    Name (English)
                  </label>
                  <input
                    type="text"
                    value={formData.nameEnglish}
                    onChange={(e) => setFormData((prev) => ({ ...prev, nameEnglish: e.target.value }))}
                    placeholder="e.g. Uttar Pradesh"
                    className="w-full px-3 py-2 bg-paper-tint border border-border-rule text-on-surface focus:outline-none focus:bg-paper-canvas"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-secondary mb-1">
                  स्लग (URL Slug) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="uttar-pradesh"
                  className="w-full px-3 py-2 bg-paper-tint border border-border-rule text-on-surface font-mono text-xs focus:outline-none focus:bg-paper-canvas"
                />
              </div>

              <div>
                <label className="block font-bold text-secondary mb-1">
                  विवरण (Description)
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="श्रेणी के संबंध में संक्षिप्त विवरण"
                  className="w-full px-3 py-2 bg-paper-tint border border-border-rule text-on-surface focus:outline-none focus:bg-paper-canvas"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-secondary mb-1">
                    रंग कोड (Color Hex)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                      className="w-8 h-8 cursor-pointer border border-border-rule p-0"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                      className="w-full px-2 py-1.5 bg-paper-tint border border-border-rule font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-secondary mb-1">
                    प्राथमिकता क्रम (Display Order)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.displayOrder}
                    onChange={(e) => setFormData((prev) => ({ ...prev, displayOrder: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-paper-tint border border-border-rule text-on-surface font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isPrimary}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isPrimary: e.target.checked }))}
                    className="accent-primary-container"
                  />
                  <span>मुख्य श्रेणी (Primary)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.showInNavigation}
                    onChange={(e) => setFormData((prev) => ({ ...prev, showInNavigation: e.target.checked }))}
                    className="accent-primary-container"
                  />
                  <span>नेविगेशन में दिखाएं</span>
                </label>
              </div>

              <div className="pt-3 border-t border-border-rule flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-border-rule hover:bg-paper-subtle font-inter text-xs cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-primary-container text-white font-mukta font-bold text-sm hover:bg-primary transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingCategory ? 'अपडेट सहेजें' : 'श्रेणी बनाएं'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
