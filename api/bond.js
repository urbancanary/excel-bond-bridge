// Excel Online Bridge for Institutional Bond Calculations
// Deploys to: https://your-project.vercel.app
// Usage: =WEBSERVICE("https://your-project.vercel.app/api/bond?metric=yield&bond=T 3 15/08/52&price=71.66")

export default async function handler(req, res) {
  // Enable CORS for Excel Online
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    const { metric, bond, price = '100.0' } = req.query;
    
    if (!metric || !bond) {
      res.status(400).send('ERROR_MISSING_PARAMETERS');
      return;
    }
    
    // Call your institutional-grade cloud API
    const cloudResponse = await fetch('https://future-footing-414610.uc.r.appspot.com/api/v1/bond/analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'gax10_demo_3j5h8m9k2p6r4t7w1q'
      },
      body: JSON.stringify({
        description: bond,
        price: parseFloat(price)
      })
    });
    
    if (!cloudResponse.ok) {
      res.status(500).send('ERROR_API_CALL');
      return;
    }
    
    const result = await cloudResponse.json();
    
    if (result.status !== 'success') {
      res.status(500).send('ERROR_CALCULATION');
      return;
    }
    
    const analytics = result.analytics || {};
    
    // Return the requested metric as plain text for Excel
    switch (metric.toLowerCase()) {
      case 'yield':
      case 'ytm':
        res.send(String(analytics.ytm || 0));
        break;
      case 'duration':
      case 'oad':
        res.send(String(analytics.duration || 0));
        break;
      case 'spread':
        res.send(String(analytics.spread || 0));
        break;
      case 'accrued':
      case 'accrued_interest':
        res.send(String(analytics.accrued_interest || 0));
        break;
      case 'convexity':
        res.send(String(analytics.convexity || 0));
        break;
      case 'pvbp':
        res.send(String(analytics.pvbp || 0));
        break;
      case 'test':
        res.send('BRIDGE_WORKING');
        break;
      default:
        res.status(400).send('ERROR_UNKNOWN_METRIC');
    }
    
  } catch (error) {
    console.error('Bridge error:', error);
    res.status(500).send(`ERROR_${error.message.replace(/\s+/g, '_')}`);
  }
}