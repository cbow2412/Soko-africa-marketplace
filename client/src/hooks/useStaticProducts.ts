import { useState, useEffect } from 'react';

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  imageUrl: string | null;
  sellerId: number;
  categoryId: number;
  categoryName: string;
  whatsappNumber: string;
  createdAt: string;
}

export function useStaticProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('/data/products.json');
        if (!response.ok) {
          throw new Error('Failed to fetch static products');
        }
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        console.error('Error loading static products:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return { products, isLoading, error };
}
