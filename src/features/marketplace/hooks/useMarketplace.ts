import { useMemo, useState } from "react";
import type { CartItem, FashionCategory, FashionProduct } from "@/shared/types";
import {
    FREE_SHIPPING_THRESHOLD,
    MARKETPLACE_CATEGORIES,
    STANDARD_SHIPPING_FEE,
    VIP_COUPON_CODE,
    VIP_COUPON_DISCOUNT_PERCENT,
} from "../constants/marketplaceCategories";

/**
 * Local UI state and derived totals for the Store/Marketplace view:
 * category + price filtering, the product detail modal, the cart drawer,
 * and coupon/shipping/total math. Cart mutations themselves live in
 * useCartStore — this hook only reads the cart items it's given to compute
 * the numbers this page needs to display.
 */
export function useMarketplace(products: FashionProduct[], cartItems: CartItem[]) {
    const [selectedCategory, setSelectedCategory] = useState<FashionCategory | "All">("All");
    const [priceRange, setPriceRange] = useState<number>(3000);
    const [activeProductDetail, setActiveProductDetail] = useState<FashionProduct | null>(null);
    const [selectedSize, setSelectedSize] = useState<string>("M");
    const [selectedColor, setSelectedColor] = useState<string>("");
    const [showCartDrawer, setShowCartDrawer] = useState<boolean>(false);
    const [coupon, setCoupon] = useState<string>("");
    const [couponMessage, setCouponMessage] = useState<string>("");
    const [discountPercent, setDiscountPercent] = useState<number>(0);
    const [couponApplied, setCouponApplied] = useState<boolean>(false);

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
            const matchesPrice = product.price <= priceRange;
            return matchesCategory && matchesPrice;
        });
    }, [priceRange, products, selectedCategory]);

    const openProductDetail = (product: FashionProduct) => {
        setActiveProductDetail(product);
        setSelectedSize(product.sizes[0] ?? "M");
        setSelectedColor(product.colors[0]?.name ?? "");
    };

    const applyCouponCode = () => {
        if (coupon.trim().toUpperCase() === VIP_COUPON_CODE) {
            setDiscountPercent(VIP_COUPON_DISCOUNT_PERCENT);
            setCouponApplied(true);
            setCouponMessage(`Coupon "${VIP_COUPON_CODE}" applied — ${VIP_COUPON_DISCOUNT_PERCENT}% off.`);
        } else {
            setCouponMessage("Invalid promotional code.");
        }
    };

    const cartSubtotal = useMemo(
        () => cartItems.reduce((sum, item) => sum + item.totalPrice, 0),
        [cartItems]
    );
    const discountAmount = (cartSubtotal * discountPercent) / 100;
    const shippingFee = cartSubtotal > FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
    const cartTotal = cartSubtotal - discountAmount + shippingFee;

    return {
        categories: MARKETPLACE_CATEGORIES,
        selectedCategory,
        setSelectedCategory,
        priceRange,
        setPriceRange,
        activeProductDetail,
        setActiveProductDetail,
        openProductDetail,
        selectedSize,
        setSelectedSize,
        selectedColor,
        setSelectedColor,
        showCartDrawer,
        setShowCartDrawer,
        coupon,
        setCoupon,
        couponMessage,
        couponApplied,
        applyCouponCode,
        filteredProducts,
        cartSubtotal,
        discountAmount,
        discountPercent,
        shippingFee,
        cartTotal,
    };
}
