// ===========================================
// src/context/ProductContext.jsx
// FINAL v24 — CACHE + ADMIN STABLE
// ===========================================

import React, {
  createContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {

  // -------------------------------
  // PRODUCT STATE
  // -------------------------------
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categories, setCategories] = useState([]);

  // -------------------------------
  // CACHES
  // -------------------------------
  const productCache = useRef({});
  const productDetailCache = useRef({});

  // -------------------------------
  // SEARCH
  // -------------------------------
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState({
    products: [],
    categories: [],
    subcategories: [],
  });

  // -------------------------------
  // UI
  // -------------------------------
  const [loadingCategory, setLoadingCategory] = useState(false);

  // -------------------------------
  // API BASE
  // -------------------------------
  const API_BASE =
    import.meta.env.VITE_API_URL ||
    "https://bhavya-event-mart.onrender.com";

  // -------------------------------
  // SAFE JSON
  // -------------------------------
  const safeJson = async (res) => {
    try {
      return await res.json();
    } catch (err) {
      console.error("❌ JSON parse error:", err);
      return null;
    }
  };

  // ======================================================
  // FETCH CATEGORIES
  // ======================================================
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/categories`);
      if (!res.ok) return;

      const data = await safeJson(res);

      const formatted = (data || []).map((cat) => ({
        _id: cat._id,
        name: cat.name,
        subcategories: (cat.subcategories || []).map((s) =>
          typeof s === "string" ? s : s.name
        ),
      }));

      setCategories(formatted);

    } catch (err) {
      console.error("❌ Category fetch error:", err);
    }
  }, [API_BASE]);

  // ======================================================
  // CATEGORY PRODUCTS (WITH CACHE)
  // ======================================================
  const fetchCategoryProducts = useCallback(
    async (category, subcategory = "") => {
      if (!category) return;

      const cacheKey = `${category}__${subcategory}`;

      // 🔥 Use cache
      if (productCache.current[cacheKey]) {
        setProducts(productCache.current[cacheKey]);
        return;
      }

      setLoadingCategory(true);

      try {
        let url = `${API_BASE}/api/products?category=${encodeURIComponent(category)}`;

        if (subcategory) {
          url += `&subcategory=${encodeURIComponent(subcategory)}`;
        }

        const res = await fetch(url);
        if (!res.ok) return;

        const data = await safeJson(res);

        if (Array.isArray(data)) {
          productCache.current[cacheKey] = data;
          setProducts(data);
        }

      } catch (err) {
        console.error("❌ Category products error:", err);
      } finally {
        setLoadingCategory(false);
      }
    },
    [API_BASE]
  );

  // ======================================================
  // ADMIN FETCH — SIMPLE + STABLE (RESTORED)
  // ======================================================
  const fetchAllProductsAdmin = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(
        `${API_BASE}/api/products/admin?limit=10000`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) return;

      const data = await safeJson(res);

      if (!data || !Array.isArray(data.products)) return;

      setProducts(data.products);
      setTotalProducts(data.total || data.products.length);

    } catch (err) {
      console.error("❌ Admin fetch error:", err);
    }
  }, [API_BASE]);

  // ======================================================
  // PRELOAD PRODUCT (CACHE MULTIPLE)
  // ======================================================
  const preloadProduct = useCallback(
    async (id) => {
      if (!id) return null;

      if (productDetailCache.current[id]) {
        return productDetailCache.current[id];
      }

      try {
        const res = await fetch(`${API_BASE}/api/products/${id}`);
        if (!res.ok) return null;

        const data = await safeJson(res);

        if (data?._id) {
          productDetailCache.current[id] = data;
          return data;
        }

      } catch {}

      return null;
    },
    [API_BASE]
  );

  // ======================================================
  // SEARCH
  // ======================================================
  const searchProducts = useCallback(
    async (q) => {
      if (!q?.trim()) {
        setSearchResults({
          products: [],
          categories: [],
          subcategories: [],
        });
        return;
      }

      try {
        const res = await fetch(
          `${API_BASE}/api/products/search?q=${encodeURIComponent(q)}`
        );

        if (!res.ok) return;

        const data = await safeJson(res);

        setSearchResults({
          products: data?.products || [],
          categories: data?.categories || [],
          subcategories: data?.subcategories || [],
        });

      } catch (err) {
        console.error("❌ Search error:", err);
      }
    },
    [API_BASE]
  );

  // ======================================================
  // EFFECTS
  // ======================================================
  useEffect(() => {
    searchProducts(searchTerm);
  }, [searchTerm, searchProducts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ======================================================
  // PROVIDER
  // ======================================================
  return (
    <ProductContext.Provider
      value={{
        products,
        setProducts,
        totalProducts,
        categories,
        fetchCategories,
        loadingCategory,
        fetchCategoryProducts,
        searchTerm,
        setSearchTerm,
        searchResults,
        preloadProduct,
        fetchAllProductsAdmin,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};