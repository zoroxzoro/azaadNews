/**
 * Pagination helper utility for news lists and search results
 */

/**
 * Paginates an array of items and builds page number ranges
 *
 * @param {Array} items - List of items to paginate
 * @param {number} [page=1] - 1-indexed page number
 * @param {number} [perPage=8] - Items per page
 * @returns {object} - Pagination state and current slice
 */
export function paginateNews(items = [], page = 1, perPage = 8) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const currentPage = Math.min(Math.max(1, parseInt(page, 10) || 1), totalPages);

  const startIndex = (currentPage - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, totalItems);
  const currentItems = items.slice(startIndex, endIndex);

  // Generate page numbers with ellipsis (e.g., [1, 2, 3, 4, '...', 18])
  const pageNumbers = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    pageNumbers.push(1);

    if (currentPage > 3) {
      pageNumbers.push('...');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      if (!pageNumbers.includes(i)) {
        pageNumbers.push(i);
      }
    }

    if (currentPage < totalPages - 2) {
      pageNumbers.push('...');
    }

    if (!pageNumbers.includes(totalPages)) {
      pageNumbers.push(totalPages);
    }
  }

  return {
    items: currentItems,
    totalItems,
    totalPages,
    currentPage,
    perPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    pageNumbers,
    startIndex: totalItems === 0 ? 0 : startIndex + 1,
    endIndex,
  };
}
