/**
 * SADAF | Reviews — Review Title Helper
 *
 * Maps a star rating to a short review title. Shared by every review form
 * (orders page + product detail page) so titles stay consistent.
 */

export function titleForRating(rating: number): string {
    if (rating >= 5) return 'Exceptional — exceeded every expectation';
    if (rating === 4) return 'Loved my SADAF piece';
    if (rating === 3) return 'Good, with room to improve';
    if (rating === 2) return 'Not quite what I expected';
    return 'Disappointed with the experience';
}
