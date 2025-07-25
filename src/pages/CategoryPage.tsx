import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import ProductCatalog from '@/components/ProductCatalog';
import Pagination from '@/components/Pagination';
import ImageModal from '@/components/ImageModal';
import MainHeader from '@/components/MainHeader';
import { useProductsData } from '@/hooks/useProductsData';
import { useProductOperations } from '@/hooks/useProductOperations';
import { useUserManagement } from '@/hooks/useUserManagement';
import { Product, Category, Language } from '@/types/product';
import { getRussianFields } from '@/utils/productHelpers';
import { translations } from '@/utils/translations';

const CategoryPage: React.FC = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Извлекаем путь категории из URL
  const categoryPath = location.pathname.replace('/category/', '');
  
  const currentPage = parseInt(searchParams.get('page') || '1');
  const itemsPerPage = parseInt(searchParams.get('limit') || '25');
  
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('ru');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // MainHeader states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    nameEn: '', nameCn: '', nameRu: '', price: 0, sku: '', quantity: 0,
    brand: '', webLink: '', category: '', description: '', descriptionEn: '', descriptionCn: '',
    tnved: '', material: '', purpose: '', forWhom: ''
  });
  const [activeTab, setActiveTab] = useState('catalog');
  
  // Get data from hook
  const { products, setProducts, categories } = useProductsData();
  const { authState } = useUserManagement();
  
  // Get product operations for editing
  const {
    editingField,
    setEditingField,
    showImageManager,
    setShowImageManager,
    newImageUrl,
    setNewImageUrl,
    handleFieldEdit,
    handleImageNavigation,
    handleFileUpload,
    addImageByUrl,
    removeImageFromProduct,
    setCurrentImage
  } = useProductOperations(products, setProducts);
  
  const t = translations[language];

  // Автоматическое переключение на китайский для пользователей chinese_only и victor
  useEffect(() => {
    if (authState.currentUser?.role === 'chinese_only' || authState.currentUser?.role === 'victor') {
      setLanguage('cn');
    }
  }, [authState.currentUser]);

  // Find category by path
  const findCategoryByPath = (cats: Category[], path: string): Category | null => {
    const pathParts = path.split('/');
    let currentCats = cats;
    let category: Category | null = null;
    
    for (const part of pathParts) {
      category = currentCats.find(c => c.name === decodeURIComponent(part)) || null;
      if (!category) return null;
      currentCats = category.children || [];
    }
    
    return category;
  };

  // Filter products by category
  const filterProductsByCategory = (categoryPath: string): Product[] => {
    const decodedPath = categoryPath.split('/').map(part => decodeURIComponent(part)).join('/');
    console.log('Filtering products for path:', decodedPath);
    console.log('Available products:', products.map(p => ({ name: p.nameRu, category: p.category, additionalCategories: p.additionalCategories })));
    
    const filtered = products.filter(product => {
      const normalizedSearchPath = decodedPath.trim();
      
      // Extract the last part of the search path (leaf category)
      const searchPathParts = normalizedSearchPath.split('/');
      const leafCategory = searchPathParts[searchPathParts.length - 1];
      
      // Helper function to check if a category matches
      const checkCategoryMatch = (categoryToCheck: string) => {
        const normalizedCategory = categoryToCheck.trim();
        
        // 1. Exact match with full path
        const fullPathMatch = normalizedCategory === normalizedSearchPath;
        
        // 2. Product category starts with search path
        const startsWithMatch = normalizedCategory.startsWith(normalizedSearchPath);
        
        // 3. Product category ends with leaf category (for backwards compatibility)
        const leafMatch = normalizedCategory === leafCategory || 
                         normalizedCategory.endsWith('/' + leafCategory);
        
        return fullPathMatch || startsWithMatch || leafMatch;
      };
      
      // Check primary category
      const primaryMatches = checkCategoryMatch(product.category);
      
      // Check additional categories
      const additionalMatches = product.additionalCategories && 
        product.additionalCategories.some(addCat => checkCategoryMatch(addCat));
      
      const matches = primaryMatches || additionalMatches;
      
      console.log(`Checking product "${product.nameRu}":`, {
        primaryCategory: product.category,
        additionalCategories: product.additionalCategories,
        searchPath: normalizedSearchPath,
        primaryMatches,
        additionalMatches,
        matches
      });
      
      return matches;
    });
    
    console.log('Filtered products:', filtered.map(p => ({ name: p.nameRu, category: p.category, additionalCategories: p.additionalCategories })));
    return filtered;
  };

  // Get full category path
  const getCategoryPath = (): string => {
    if (!categoryPath) return '';
    return categoryPath.split('/').map(part => decodeURIComponent(part)).join('/');
  };

  // Get breadcrumb from category path
  const getBreadcrumb = (): Category[] => {
    if (!categoryPath) return [];
    
    const pathParts = categoryPath.split('/');
    const breadcrumb: Category[] = [];
    let currentCats = categories;
    
    for (const part of pathParts) {
      const decodedPart = decodeURIComponent(part);
      const category = currentCats.find(c => c.name === decodedPart);
      if (category) {
        breadcrumb.push(category);
        currentCats = category.children || [];
      }
    }
    
    return breadcrumb;
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    if (!categoryPath) return [];
    return filterProductsByCategory(categoryPath);
  }, [products, categoryPath]);

  // Sort products by creation date (newest first) - use ID as proxy for creation order
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      // Assuming higher ID means more recent (last created)
      return (b.id || 0) - (a.id || 0);
    });
  }, [filteredProducts]);

  useEffect(() => {
    if (!categoryPath) {
      setIsLoading(false);
      return;
    }

    const category = findCategoryByPath(categories, categoryPath);
    if (category) {
      setCurrentCategory(category);
    }
    setIsLoading(false);
  }, [categoryPath, categories]);

  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page.toString());
    setSearchParams(newParams);
  };

  const handleItemsPerPageChange = (limit: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('limit', limit);
    newParams.set('page', '1'); // Reset to first page
    setSearchParams(newParams);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader2" size={48} className="mx-auto mb-4 text-blue-600 animate-spin" />
          <p className="text-gray-600">Загрузка каталога...</p>
        </div>
      </div>
    );
  }

  if (!currentCategory) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Icon name="FolderX" size={64} className="mx-auto mb-4 text-gray-400" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Категория не найдена</h1>
          <p className="text-gray-600 mb-6">Запрашиваемая категория не существует или была удалена.</p>
          <Button 
            onClick={() => window.history.back()}
            variant="outline"
            className="mr-3"
          >
            <Icon name="ArrowLeft" size={16} className="mr-2" />
            Назад
          </Button>
          <Button onClick={() => window.location.href = '/'}>
            <Icon name="Home" size={16} className="mr-2" />
            На главную
          </Button>
        </div>
      </div>
    );
  }

  // Pagination calculations
  const totalProducts = sortedProducts.length;
  const totalPages = Math.ceil(totalProducts / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = sortedProducts.slice(startIndex, endIndex);

  const handleProductUpdate = (updatedProduct: Product) => {
    const updatedProducts = products.map(p => 
      p.id === updatedProduct.id ? updatedProduct : p
    );
    setProducts(updatedProducts);
  };

  const handleAdditionalCategoriesChange = (productId: string, additionalCategories: string[]) => {
    setProducts(prev => prev.map(product => 
      product.id === productId 
        ? { ...product, additionalCategories }
        : product
    ));
  };

  const handlePriceRequest = (productId: string) => {
    setProducts(prev => prev.map(product => {
      if (product.id === productId) {
        const updatedAdditionalCategories = product.additionalCategories || [];
        
        // Добавляем категорию "Запрос цены", если её ещё нет
        if (!updatedAdditionalCategories.includes('Запрос цены')) {
          updatedAdditionalCategories.push('Запрос цены');
        }

        return {
          ...product,
          price: 0, // Обнуляем цену
          additionalCategories: updatedAdditionalCategories
        };
      }
      return product;
    }));
  };

  // Get all unique categories for form
  const allCategories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);

  const addProduct = () => {
    if (newProduct.nameEn && newProduct.price > 0) {
      const product: Product = {
        id: (products.length + 1).toString(),
        nameEn: newProduct.nameEn,
        nameCn: newProduct.nameCn || '',
        nameRu: newProduct.nameRu || newProduct.nameEn,
        price: newProduct.price,
        sku: newProduct.sku || `SKU-${Date.now()}`,
        quantity: newProduct.quantity || 0,
        brand: newProduct.brand || '',
        webLink: newProduct.webLink || '',
        category: newProduct.category || 'Без категории',
        images: ['/img/b9923599-1ff7-4529-bb51-c69743d2a5bf.jpg'],
        currentImageIndex: 0,
        description: newProduct.description || '',
        descriptionEn: newProduct.descriptionEn || '',
        descriptionCn: newProduct.descriptionCn || '',
        tnved: newProduct.tnved || '',
        material: newProduct.material || '',
        purpose: newProduct.purpose || '',
        forWhom: newProduct.forWhom || ''
      };

      setProducts(prev => [...prev, product]);
      setNewProduct({
        nameEn: '', nameCn: '', nameRu: '', price: 0, sku: '', quantity: 0,
        brand: '', webLink: '', category: '', description: '', descriptionEn: '', descriptionCn: '',
        tnved: '', material: '', purpose: '', forWhom: ''
      });
      setShowAddForm(false);
    }
  };

  const breadcrumb = getBreadcrumb();

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader
        language={language}
        onLanguageChange={setLanguage}
        showAddForm={showAddForm}
        setShowAddForm={setShowAddForm}
        newProduct={newProduct}
        setNewProduct={setNewProduct}
        allCategories={allCategories}
        categories={categories}
        translations={t}
        onAddProduct={addProduct}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <nav className="mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <a href="/" className="hover:text-blue-600 transition-colors">
                <Icon name="Home" size={16} />
              </a>
              {breadcrumb.map((cat, index) => (
                <React.Fragment key={cat.id}>
                  <Icon name="ChevronRight" size={14} className="text-gray-400" />
                  <span 
                    className={index === breadcrumb.length - 1 ? 'text-gray-900 font-medium' : 'hover:text-blue-600 cursor-pointer'}
                  >
                    {cat.name}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </nav>

          {/* Category Header */}
          <div className="flex items-center gap-4 mb-6">
            {currentCategory.icon && (
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                <Icon name={currentCategory.icon} size={32} className="text-blue-600" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{currentCategory.name}</h1>
              <p className="text-gray-600 mt-1">
                Показано {currentProducts.length} из {totalProducts} товаров (отсортированы по дате создания)
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Показывать по:</span>
              <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="75">75</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-700">товаров</span>
            </div>

            {/* Pagination Info */}
            <div className="text-sm text-gray-600">
              Страница {currentPage} из {totalPages}
            </div>
          </div>

          {/* Top Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
              <div className="text-sm text-gray-600">
                Показано {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, totalProducts)} из {totalProducts} товаров
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentProducts.length > 0 ? (
          <>
            <ProductCatalog
              products={currentProducts.map(product => {
                const russianFields = getRussianFields(product.category || '', product.nameEn || '');
                return {
                  ...product,
                  ...russianFields
                };
              })}
              categories={categories}
              language={language}
              translations={t}
              editingField={editingField}
              setEditingField={setEditingField}
              onFieldEdit={handleFieldEdit}
              onImageNavigation={handleImageNavigation}
              onShowImageManager={setShowImageManager}
              onImageClick={setSelectedProduct}
              onAdditionalCategoriesChange={handleAdditionalCategoriesChange}
              onPriceRequest={handlePriceRequest}
            />

            {/* Bottom Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
                <div className="text-sm text-gray-600">
                  Показано {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, totalProducts)} из {totalProducts} товаров
                </div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <Icon name="Package" size={64} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Товары не найдены</h3>
            <p className="text-gray-600 mb-6">В данной категории пока нет товаров.</p>
            <Button onClick={() => window.history.back()}>
              <Icon name="ArrowLeft" size={16} className="mr-2" />
              Вернуться назад
            </Button>
          </div>
        )}
        
        {/* Image Modal */}
        {selectedProduct && (
          <ImageModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onPrevImage={() => handleImageNavigation(selectedProduct.id, 'prev')}
            onNextImage={() => handleImageNavigation(selectedProduct.id, 'next')}
          />
        )}
      </div>
    </div>
  );
};

export default CategoryPage;