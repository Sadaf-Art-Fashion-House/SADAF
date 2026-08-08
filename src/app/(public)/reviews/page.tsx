import type { Metadata } from 'next';
import ReviewsPageClient from '@/features/reviews/components/ReviewsPageClient';
import type { Review } from '@/features/reviews/types';

export const metadata: Metadata = {
    title: 'Customer Reviews | SADAF Atelier',
    description: 'Read reviews from SADAF customers across fashion, artworks, and collections.',
};

function getMockReviews(): Review[] {
    return [
        {
            id: 'rev-1', productId: 'f-1', productName: 'Empress Diwani Abaya Cape',
            productImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=400&q=80',
            productHref: '/store', userName: 'Layla M.', userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80', rating: 5,
            title: 'Absolutely breathtaking craftsmanship',
            comment: 'The gold calligraphy embroidery is even more stunning in person. Wore it to a gala and received countless compliments. The velvet drapes perfectly.',
            createdAt: '2026-06-15T10:30:00Z', verified: true,
        },
        {
            id: 'rev-2', productId: 'f-2', productName: 'Sadaf Inlaid Peak Tuxedo',
            productImage: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=400&q=80',
            productHref: '/store', userName: 'Karim A.', userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80', rating: 5,
            title: 'The finest tuxedo I have ever owned',
            comment: 'The mother-of-pearl inlay buttons are a work of art. The wool is incredibly soft yet structured. Worth every penny for a true gentleman.',
            createdAt: '2026-05-28T14:00:00Z', verified: true,
        },
        {
            id: 'rev-3', productId: 'f-3', productName: 'Fatimid Star Silk Slip Dress',
            productImage: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=400&q=80',
            productHref: '/store', userName: 'Nadia H.', userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80', rating: 5,
            title: 'Like wearing liquid gold',
            comment: 'The silk is divine — so smooth and luxurious. The Fatimid star pattern catches the light beautifully. A true statement piece.',
            createdAt: '2026-06-02T09:00:00Z', verified: true,
        },
        {
            id: 'rev-4', productId: 'f-4', productName: 'Gilded Caliph Streetwear Hoodie',
            productImage: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=400&q=80',
            productHref: '/store', userName: 'Omar S.', userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80', rating: 5,
            title: 'Streetwear meets heritage — perfect',
            comment: 'The puff print Cairo grid details are incredible. Heavy weight fabric feels premium. Got the limited edition — proud to own piece #47.',
            createdAt: '2026-06-10T16:45:00Z', verified: true,
        },
        {
            id: 'rev-5', productId: 'f-5', productName: 'Royal Heir Linen Set',
            productImage: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=400&q=80',
            productHref: '/store', userName: 'Fatima R.', userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80', rating: 4,
            title: 'Beautiful set for my daughter',
            comment: 'The linen is incredibly soft and the gold stitching is exquisite. Runs slightly large but that means she can grow into it.',
            createdAt: '2026-05-20T11:30:00Z', verified: true,
        },
        {
            id: 'rev-6', productId: 'art-1', productName: 'The Golden Diwani Diptych',
            productImage: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=400&q=80',
            productHref: '/artworks', userName: 'Yasmin F.', userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80', rating: 5,
            title: 'A masterpiece for my collection',
            comment: 'Master El-Saeed\'s calligraphy is unparalleled. The 24k gold leaf catches the light differently throughout the day. A treasure.',
            createdAt: '2026-04-15T08:00:00Z', verified: true,
        },
        {
            id: 'rev-7', productId: 'art-2', productName: 'Fatimid Octagram Inlay Platter',
            productImage: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=400&q=80',
            productHref: '/artworks', userName: 'Amir K.', userAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80', rating: 5,
            title: 'Heritage craftsmanship at its finest',
            comment: 'You can see the 50 hours of work in every detail. The mother-of-pearl inlay is mesmerizing. Centerpiece of my dining room.',
            createdAt: '2026-03-22T13:15:00Z', verified: true,
        },
        {
            id: 'rev-8', productId: 'art-3', productName: 'Nile Reflections in Royal Orchid',
            productImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=400&q=80',
            productHref: '/artworks', userName: 'Dr. Farida H.', userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80', rating: 5,
            title: 'Breathtaking impasto technique',
            comment: 'The texture is incredible — you can feel the movement of the Nile in the thick oil strokes. Colors are even richer in person.',
            createdAt: '2026-05-08T10:00:00Z', verified: false,
        },
        {
            id: 'rev-9', productId: 'f-1', productName: 'Empress Diwani Abaya Cape',
            productImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=400&q=80',
            productHref: '/store', userName: 'Samira L.', userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80', rating: 4,
            title: 'Elegant but needs careful handling',
            comment: 'Stunning design and the gold thread work is impeccable. However the velvet is delicate — dry clean only as stated. Worth the care.',
            createdAt: '2026-06-18T15:20:00Z', verified: true,
        },
        {
            id: 'rev-10', productId: 'f-3', productName: 'Fatimid Star Silk Slip Dress',
            productImage: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=400&q=80',
            productHref: '/store', userName: 'Hana Z.', userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80', rating: 5,
            title: 'Perfect for summer weddings',
            comment: 'The silk is weightless and the geometric print is stunning. I felt like royalty wearing this to a garden wedding.',
            createdAt: '2026-06-05T12:00:00Z', verified: true,
        },
    ];
}

export default async function ReviewsPage() {
    const reviews = getMockReviews();
    return <ReviewsPageClient reviews={reviews} />;
}
