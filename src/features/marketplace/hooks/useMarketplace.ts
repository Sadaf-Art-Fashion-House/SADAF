import { useMemo, useState } from 'react';
import type { CartItem, FashionCategory, FashionProduct } from '../../../types';

export function useMarketplace(products: FashionProduct[], cart: CartItem[], wishlist: FashionProduct[]) {
    const [selectedCategory, setSelectedCategory] = useState<FashionCategory | 'All'>('All');
    const [priceRange, setPriceRange] = useState<number>(3000);
    const [activeProductDetail, setActiveProductDetail] = useState<FashionProduct | null>(null);
    const [selectedSize, setSelectedSize] = useState<string>('M');
    const [selectedColor, setSelectedColor] = useState<string>('');
    const [showCartDrawer, setShowCartDrawer] = useState<boolean>(false);
    const [coupon, setCoupon] = useState<string>('');
    const [discountPercent, setDiscountPercent] = useState<number>(0);
    const [couponApplied, setCouponApplied] = useState<boolean>(false);

    const categories: (FashionCategory | 'All')[] = ['All', 'Women', 'Men', 'Kids', 'Traditional Fusion', 'Limited Edition'];

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
            const matchesPrice = product.price <= priceRange;
            return matchesCategory && matchesPrice;
        });
    }, [priceRange, products, selectedCategory]);

    const applyCouponCode = () => {
        if (coupon.trim().toUpperCase() === 'SADAF2026') {
            setDiscountPercent(15);
            setCouponApplied(true);
            alert("Promotional coupon 'SADAF2026' successfully applied (15% deduction).");
        } else {
            alert('Invalid promotional code.');
        }
    };

    const cartSubtotal = useMemo(() => cart.reduce((sum, item) => sum + item.totalPrice, 0), [cart]);
    const discountAmount = (cartSubtotal * discountPercent) / 100;
    const shippingFee = cartSubtotal > 1000 ? 0 : 75;
    const cartTotal = cartSubtotal - discountAmount + shippingFee;

    return {
        selectedCategory,
        setSelectedCategory,
        priceRange,
        setPriceRange,
        activeProductDetail,
        setActiveProductDetail,
        selectedSize,
        setSelectedSize,
        selectedColor,
        setSelectedColor,
        showCartDrawer,
        setShowCartDrawer,
        coupon,
        setCoupon,
        discountPercent,
        setDiscountPercent,
        couponApplied,
        setCouponApplied,
        categories,
        filteredProducts,
        applyCouponCode,
        cartSubtotal,
        discountAmount,
        shippingFee,
        cartTotal,
        wishlistCount: wishlist.length
    };
}
