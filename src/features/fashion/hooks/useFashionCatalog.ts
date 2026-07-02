import { useMemo, useState } from 'react';
import type { FashionCategory, FashionProduct } from '../../../types';

export function useFashionCatalog(products: FashionProduct[]) {
    const [activeCategory, setActiveCategory] = useState<FashionCategory | 'All'>('All');

    const filteredProducts = useMemo(() => {
        if (activeCategory === 'All') return products;
        return products.filter((product) => product.category === activeCategory);
    }, [activeCategory, products]);

    return {
        activeCategory,
        setActiveCategory,
        filteredProducts,
        categories: ['All', 'Women', 'Men', 'Kids', 'Traditional Fusion', 'Limited Edition'] as (FashionCategory | 'All')[]
    };
}
