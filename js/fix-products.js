/**
 * Consolidated Product Fixes
 * This file combines all product-related fixes into a single module
 */

const ProductFixes = (() => {
    // Private utility functions
    const $ = selector => document.querySelector(selector);
    const $$ = selector => document.querySelectorAll(selector);
    const formatPrice = price => `₹${price.toLocaleString('en-IN')}`;
    const getFloat = (el, attr) => parseFloat(el.getAttribute(attr));
    const getDataAttr = (el, attr) => el.getAttribute(`data-${attr}`);
    const log = (msg, ...args) => console.log(`PRODUCT FIXES: ${msg}`, ...args);

    // Currency module
    const currency = {
        format: formatPrice,
        update() {
            $$('.price').forEach(el => {
                const price = getFloat(el, 'data-price');
                if (!isNaN(price)) el.textContent = formatPrice(price);
            });
        }
    };

    // Filter module
    const filter = {
        init() {
            this.setupEventListeners();
            this.initializeState();
        },

        setupEventListeners() {
            // Checkbox filters
            $$('.filter-option input[type="checkbox"]').forEach(cb => 
                cb.addEventListener('change', () => this.applyFilters())
            );

            // Price inputs
            $$('.price-input input').forEach(input => 
                input.addEventListener('change', () => this.applyFilters())
            );
            
            // Filter buttons
            const applyBtn = $('.apply-filter');
            const clearBtn = $('.clear-filter');
            
            if (applyBtn) {
                log('Setting up Apply Filter button');
                applyBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    log('Apply filter button clicked from ProductFixes');
                    this.applyFilters();
                });
            }
            
            if (clearBtn) {
                log('Setting up Clear Filter button');
                clearBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    log('Clear filter button clicked from ProductFixes');
                    this.clearFilters();
                    this.applyFilters();
                });
            }
        },

        initializeState() {
            const params = new URLSearchParams(window.location.search);
            // ... rest of initialization logic
        },
        
        clearFilters() {
            log('Clearing all filters from ProductFixes');
            
            // Reset checkboxes
            $$('input[type="checkbox"]').forEach(cb => cb.checked = false);
            
            // Reset price inputs
            const minInput = $('#min-price-input');
            const maxInput = $('#max-price-input');
            const minSlider = $('#min-price');
            const maxSlider = $('#max-price');
            
            if (minInput && maxInput && minSlider && maxSlider) {
                minInput.value = minSlider.min || 0;
                maxInput.value = maxSlider.max || 20000;
                minSlider.value = minSlider.min || 0;
                maxSlider.value = maxSlider.max || 20000;
            }
            
            // Show all products
            $$('.product-card').forEach(card => {
                card.style.display = 'flex';
            });
        },

        applyFilters() {
            log('Applying filters from ProductFixes');
            
            try {
                // Get selected filters
                const filters = this.getSelectedFilters();
                
                // Update product display based on filters
                this.updateProductDisplay(filters);
                
                // Count visible products for debugging
                const visibleProducts = document.querySelectorAll('.product-card[style*="display: flex"]').length;
                const totalProducts = document.querySelectorAll('.product-card').length;
                log(`Filter results: ${visibleProducts}/${totalProducts} products visible after filtering`);
                
                return true; // Signal successful filtering
            } catch (error) {
                console.error('ProductFixes: Error applying filters:', error);
                return false;
            }
        },

        getSelectedFilters() {
            const filters = {
                brands: [],
                categories: [],
                sizes: [],
                priceRange: {
                    min: parseInt($('#min-price-input')?.value) || 0,
                    max: parseInt($('#max-price-input')?.value) || 20000
                }
            };

            $$('input[name="brand"]:checked').forEach(cb => {
                filters.brands.push(cb.value.toLowerCase());
            });
            
            $$('input[name="category"]:checked').forEach(cb => {
                filters.categories.push(cb.value);
            });
            
            $$('input[name="size"]:checked').forEach(cb => {
                filters.sizes.push(cb.value.replace('uk-', ''));
            });
            
            log('Selected filters:', filters);
            return filters;
        },

        updateProductDisplay(filters) {
            log('Updating product display with filters');
            
            // First hide all products
            $$('.product-card').forEach(product => {
                product.style.display = 'none';
            });
            
            // Then show only matching products
            $$('.product-card').forEach(product => {
                if (this.productMatchesFilters(product, filters)) {
                    product.style.display = 'flex';
                }
            });
            
            // Apply sorting after filtering
            const sortSelect = $('#sort-select');
            if (sortSelect && typeof window.sortProducts === 'function') {
                window.sortProducts(sortSelect.value);
            }
        },

        productMatchesFilters(product, filters) {
            const brand = (getDataAttr(product, 'brand') || '').toLowerCase();
            const category = getDataAttr(product, 'category') || '';
            const sizes = getDataAttr(product, 'sizes')?.split(',') || [];
            const price = getFloat(product, 'data-price');

            // Brand filter
            const meetsBrand = !filters.brands.length || filters.brands.includes(brand);
            
            // Price filter
            const meetsPrice = price >= filters.priceRange.min && price <= filters.priceRange.max;
            
            // Size filter
            const meetsSize = !filters.sizes.length || filters.sizes.some(size => sizes.includes(size));
            
            // Category filter with special handling for unisex
            let meetsCategory = !filters.categories.length;
            if (!meetsCategory) {
                const isUnisex = category === 'unisex';
                meetsCategory = filters.categories.includes(category) ||
                              (filters.categories.includes('men') && (category === 'men' || isUnisex)) ||
                              (filters.categories.includes('women') && (category === 'women' || isUnisex));
            }
            
            return meetsBrand && meetsPrice && meetsCategory && meetsSize;
        }
    };

    // Direct fixes module
    const direct = {
        init() {
            this.fixProductCards();
            this.setupQuickView();
        },

        fixProductCards() {
            $$('.product-card').forEach(card => {
                const img = card.querySelector('img');
                if (img && !img.src) {
                    img.src = img.getAttribute('data-src');
                }

                const price = card.querySelector('.price');
                if (price) {
                    currency.format(getFloat(price, 'data-price'));
                }
            });
        },

        setupQuickView() {
            $$('.quick-view-btn').forEach(btn => {
                btn.addEventListener('click', e => {
                    e.preventDefault();
                    this.showQuickView(getDataAttr(btn.closest('.product-card'), 'product-id'));
                });
            });
        },

        showQuickView(productId) {
            const modal = $('.quick-view-modal');
            const product = $(`[data-product-id="${productId}"]`);
            
            if (modal && product) {
                const modalImg = modal.querySelector('.modal-image img');
                const modalTitle = modal.querySelector('.modal-title');
                const modalPrice = modal.querySelector('.modal-price');

                modalImg.src = product.querySelector('img').src;
                modalTitle.textContent = product.querySelector('h3').textContent;
                modalPrice.textContent = product.querySelector('.price').textContent;
                
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }
    };

    // Public API
    return {
        currency,
        filter,
        direct,
        init() {
            log('Initializing ProductFixes module');
            currency.update();
            filter.init();
            direct.init();
        }
    };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing ProductFixes');
    ProductFixes.init();
});

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductFixes;
} 