-- ============================================
-- SADAF Seed Data — Products & Artworks
-- ============================================

-- Fashion Products
INSERT INTO products (id, name, description, price, category, image_url, in_stock) VALUES
(
  'f1000000-0000-0000-0000-000000000001',
  'Empress Diwani Abaya Cape',
  'A masterpiece drape in rich navy velvet, overlaying standard silk dress lines, featuring authentic gold calligraphic embroidery sweeping along the left sleeve and lapel.',
  1850,
  'Traditional Fusion',
  'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=82',
  true
),
(
  'f1000000-0000-0000-0000-000000000002',
  'Sadaf Inlaid Peak Tuxedo',
  'Tailored to absolute precision from super-140s Egyptian wool. The lapel borders feature delicate laser-cut satin piping that mirrors mother-of-pearl geometric structures.',
  2400,
  'Men',
  'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=800&q=82',
  true
),
(
  'f1000000-0000-0000-0000-000000000003',
  'Fatimid Star Silk Slip Dress',
  'Bias-cut 100% royal mulberry silk dress. Detailed complex Fatimid star constellations printed in dynamic crystal blue-to-gold iridescent hues on high-gloss silk.',
  980,
  'Women',
  'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=82',
  true
),
(
  'f1000000-0000-0000-0000-000000000004',
  'Gilded Caliph Streetwear Hoodie',
  'An oversized luxury hoodie made from 500gsm organic loopback cotton, featuring puff-printed medieval Cairo architectural grids and modern golden accents.',
  450,
  'Limited Edition',
  'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=82',
  true
),
(
  'f1000000-0000-0000-0000-000000000005',
  'Royal Heir Linen Set',
  'A two-piece lightweight set using premium Egyptian linen, featuring exquisite geometric border stitching in gold and sand tones.',
  320,
  'Kids',
  'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=800&q=82',
  true
),
('6b5c3e7b-49a7-43c2-a6d4-712360d68680', 'Alexandrian Culture Abaya', 'Alexandrian Heritage Abaya Collection
Where the Mediterranean spirit meets timeless Egyptian elegance.
Draped in the legacy of Alexandria''s golden age — each abaya is a canvas of the city''s layered soul. Flowing silhouettes inspired by Greco-Roman arches, embroidered with arabesque motifs in deep Mediterranean blues, warm ochres, and ivory white. Delicate details echo the mosaics of ancient Alexandria — where East meets West in every thread.
Wear the city that built libraries, lit the seas, and clothed queens.', '2750', 'Traditional Fusion', 'https://gfqwkjbpumlhljkcpqsy.supabase.co/storage/v1/object/public/Alexandrian%20Culture%20Abaya/download.jpg', true, '2026-06-03 00:51:44.960054+00', null, null, null, null, null, null, '100% Egyptian Cotton & Silk Blend', ARRAY['XS','S','M','L','XL'], null);

-- Artworks (stored in products table under category 'Art')
INSERT INTO products (id, name, description, price, category, image_url, in_stock) VALUES
(
  'a1000000-0000-0000-0000-000000000001',
  'The Golden Diwani Diptych',
  'Traditional Diwani calligraphic script written in hand-processed 24k liquid gold leaf on midnight dyed cotton parchment paper. It expresses a poem on wisdom and visual rhythm. | Artist: Master Calligrapher Ahmed El-Saeed | Medium: 24k Gold Leaf & Calligraphy Ink | 120 x 80 cm',
  3400,
  'Art - Calligraphy',
  'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=800&q=82',
  true
),
(
  'a1000000-0000-0000-0000-000000000002',
  'Fatimid Octagram Inlay Platter',
  'Meticulously hand-hammered red copper decorative plate inlaid with custom-carved saltwater mother-of-pearl (Sadaf) and silver wire. A 50-hour artisan heritage piece. | Artist: The Saad Workshop (Old Cairo) | Medium: Copper, Mother-of-Pearl & Fine Silver | 45 cm Diameter',
  1850,
  'Art - Handmade',
  'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=82',
  true
),
(
  'a1000000-0000-0000-0000-000000000003',
  'Nile Reflections in Royal Orchid',
  'Heavy impasto oil painting depicting the Cairo skyline and Nile reflections through abstract Arabic geometric structures and midnight blue textures. | Artist: Dr. Farida Hammad | Medium: Impasto Oil on Linen | 150 x 150 cm',
  6800,
  'Art - Oil Paintings',
  'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=82',
  true
),
(
  'a1000000-0000-0000-0000-000000000004',
  'Fluid Arabesque Flow',
  'Futuristic digital artwork merging complex 3D Islamic star tessellations with golden fluids in non-Euclidean perspective. Available as an exclusive luxury giclée print. | Artist: Tariq Al-Faisal | Medium: High-Fidelity Archival Giclée Print | 100 x 100 cm',
  950,
  'Art - Digital',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=82',
  true
),
(
  'a1000000-0000-0000-0000-000000000005',
  'Gilded Abaya Drapery Study',
  'A charcoal and gold watercolor study on heavy cotton canvas depicting the motion of traditional drapes under modern structural cutting. | Artist: Sadaf Atelier | Medium: Gold Gouache & Charcoal | 70 x 50 cm',
  720,
  'Art - Fashion Sketches',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=82',
  true
),
(
  'a1000000-0000-0000-0000-000000000006',
  'Cairo Deco Facade',
  'Minimalist post-modern oil exploration focusing on the geometric overlap of Egyptian Art Deco grids and sandy desert winds. | Artist: Karim Abdel-Malik | Medium: Oil & Sand Texture on Linen | 140 x 100 cm',
  4900,
  'Art - Oil Paintings',
  'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=82',
  true
);
