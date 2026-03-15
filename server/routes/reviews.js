import express from 'express';

const router = express.Router();

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
let cache = { data: null, fetchedAt: 0 };

router.get('/', async (req, res) => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) {
    return res.status(503).json({ message: 'Google Places API not configured.' });
  }

  if (cache.data && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return res.json(cache.data);
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=rating,user_ratings_total,reviews&reviews_sort=newest&key=${apiKey}`;
    const response = await fetch(url);
    const json = await response.json();

    if (json.status !== 'OK') {
      return res.status(503).json({ message: `Google Places API unavailable: ${json.status}` });
    }

    const place = json.result;
    const data = {
      rating: place.rating ?? null,
      reviewCount: place.user_ratings_total ?? null,
      reviews: (place.reviews ?? []).map((r, i) => ({
        id: i + 1,
        name: r.author_name,
        rating: r.rating,
        text: r.text,
        date: r.relative_time_description,
      })),
    };

    cache = { data, fetchedAt: Date.now() };
    res.json(data);
  } catch {
    res.status(503).json({ message: 'Google Places API unavailable.' });
  }
});

export default router;
