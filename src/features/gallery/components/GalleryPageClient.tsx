"use client";

import React, { useState } from "react";
import GalleryView from "./GalleryView";
import type { GalleryItem } from "../types";

interface GalleryPageClientProps {
  galleryItems: GalleryItem[];
}

export default function GalleryPageClient({
  galleryItems,
}: GalleryPageClientProps) {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopyDesignTokens = () => {
    const tokens = `
/** SADAF Design System Variable Tokens **/
--color-gold-lustrous: #C9A84C;
--color-prussian-velvet: #0A0F2C;
--color-royal-indigo: #111A45;
--color-coastal-blue: #4FC3F7;
--color-champagne-dust: #E8E0D5;

/** Typography Setting **/
--font-serif: "Space Grotesk", "Outfit", serif;
--font-sans: "Inter", sans-serif;
--font-mono: "JetBrains Mono", monospace;
    `;
    navigator.clipboard.writeText(tokens.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <GalleryView
      galleryItems={galleryItems}
      onCopyTokens={handleCopyDesignTokens}
      copied={copied}
    />
  );
}