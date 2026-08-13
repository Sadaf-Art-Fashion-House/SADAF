"use client";

import LookbookView from "./LookbookView";
import type { LookbookItem } from "@/shared/types";

interface LookbookPageClientProps {
    lookbookItems: LookbookItem[];
}

/**
 * Client layer of the Lookbook page. The lookbook is a purely editorial
 * surface (no cart/wishlist mutations), so this stays a thin pass-through —
 * it exists to keep the 3-layer page → client → view pattern consistent
 * with the rest of the app and to host any future client logic.
 */
export default function LookbookPageClient({ lookbookItems }: LookbookPageClientProps) {
    return <LookbookView lookbookItems={lookbookItems} />;
}
