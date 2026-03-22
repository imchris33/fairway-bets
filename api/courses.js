const API_BASE = 'https://api.golfcourseapi.com/v1';
const API_KEY = process.env.GOLF_COURSE_API_KEY || 'UAWS3IOVLXWTLOIVRT6H7SEVGQ';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { search, id } = req.query;

  try {
    let url;
    if (id) {
      url = `${API_BASE}/courses/${id}`;
    } else if (search) {
      url = `${API_BASE}/courses?search=${encodeURIComponent(search)}`;
    } else {
      return res.status(400).json({ error: 'Provide ?search= or ?id= parameter' });
    }

    const response = await fetch(url, {
      headers: { 'Authorization': `Key ${API_KEY}` }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Golf course API error' });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch course data' });
  }
}
