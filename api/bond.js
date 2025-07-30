// Excel Online Bridge for Institutional Bond Calculations - FIXED VERSION
// Enhanced error handling and debugging

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
    res.status(405).send('ERROR_METHOD_NOT_ALLOWED');
    return;
  }
  
  try {
    const { metric, bond, price = '100.0' } = req.query;
    
    // Handle test endpoint locally
    if (metric && metric.toLowerCase() === 'test') {
      res.send('BRIDGE_WORKING');
      return;
    }
    
    if (!metric || !bond) {
      res.status(400).send('ERROR_MISSING_PARAMETERS');
      return;
    }
    
    // Enhanced API call with better error handling
    console.log('Making API call to:', 'https://future-footing-414610.uc.r.appspot.com/api/v1/bond/analysis');
    console.log('Payload:', { description: bond, price: parseFloat(price) });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const cloudResponse = await fetch('https://future-footing-414610.uc.r.appspot.com/api/v1/bond/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'gax10_demo_3j5h8m9k2p6r4t7w1q',
          'User-Agent': 'Excel-Bond-Bridge/1.0'
        },
        body: JSON.stringify({
          description: bond,
          price: parseFloat(price)
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('API Response Status:', cloudResponse.status);
      console.log('API Response Headers:', Object.fromEntries(cloudResponse.headers.entries()));
      
      if (!cloudResponse.ok) {
        console.error('API Response not OK:', cloudResponse.status, cloudResponse.statusText);
        res.status(500).send(`ERROR_API_STATUS_${cloudResponse.status}`);
        return;
      }
      
      const result = await cloudResponse.json();
      console.log('API Response Data:', result);
      
      if (result.status !== 'success') {
        console.error('API returned error:', result);
        res.status(500).send('ERROR_CALCULATION_FAILED');
        return;
      }
      
      const analytics = result.analytics || {};
      
      // Return the requested metric as plain text for Excel
      let value;
      switch (metric.toLowerCase()) {
        case 'yield':
        case 'ytm':
          value = analytics.ytm;
          break;
        case 'duration':
        case 'oad':
          value = analytics.duration;
          break;
        case 'spread':
          value = analytics.spread;
          break;
        case 'accrued':
        case 'accrued_interest':
          value = analytics.accrued_interest;
          break;
        case 'convexity':
          value = analytics.convexity;
          break;
        case 'pvbp':
          value = analytics.pvbp;
          break;
        default:
          res.status(400).send('ERROR_UNKNOWN_METRIC');
          return;
      }
      
      // Handle null/undefined values
      if (value === null || value === undefined) {
        res.send('0');
      } else {
        res.send(String(value));
      }
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Fetch error:', fetchError);
      
      if (fetchError.name === 'AbortError') {
        res.status(500).send('ERROR_TIMEOUT');
      } else {
        res.status(500).send(`ERROR_FETCH_${fetchError.message.replace(/\s+/g, '_')}`);
      }
    }
    
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).send(`ERROR_HANDLER_${error.message.replace(/\s+/g, '_')}`);
  }
}