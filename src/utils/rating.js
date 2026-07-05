export function renderRatingStars(rating) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const remainder = rating - fullStars;

  for (let i = 1; i <= 5; i += 1) {
    if (i <= fullStars) {
      stars.push('solid');
    } else if (i === fullStars + 1 && remainder >= 0.5) {
      stars.push('half');
    } else {
      stars.push('regular');
    }
  }
  return stars;
}
