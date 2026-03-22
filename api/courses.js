// /api/courses.js — Vercel serverless function
// Proxies to golfcourseapi.com so the API key stays server-side only

export default async function handler(req, res) {
  // Allow cross-origin requests from your own domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = process.env.GOLF_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const { q, id } = req.query;

  try {
    let url;

    if (id) {
      // Fetch full course detail (includes all 18 holes, par, stroke index)
      url = `https://api.golfcourseapi.com/v1/courses/${id}`;
    } else if (q) {
      // Search by name — send the query exactly as typed
      // The API does partial matching, so "TPC Vegas" will find "TPC Las Vegas"
      url = `https://api.golfcourseapi.com/v1/search?search_query=${encodeURIComponent(q)}`;
    } else {
      return res.status(400).json({ error: 'Provide ?q=course+name or ?id=123' });
    }

    const response = await fetch(url, {
      headers: {
        // IMPORTANT: format is "Key YOUR_KEY" not "Bearer YOUR_KEY"
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Golf API error:', response.status, text);
      return res.status(response.status).json({
        error: `Golf API returned ${response.status}`,
        detail: text,
      });
    }

    const data = await response.json();

    // Search returns { courses: [...] }
    // Course detail returns { course: { ... tees: [...] } }
    return res.status(200).json(data);

  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: err.message });
  }
}
