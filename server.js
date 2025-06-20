const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const axios = require('axios');
const fs = require('fs');

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/stores.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'stores.json'));
});

app.post('/search', async (req, res) => {
  const { query, stores } = req.body;
  if (!query || !stores || !Array.isArray(stores)) {
    return res.status(400).json({ items: [], error: 'Invalid search parameters' });
  }

  const results = [];
  const cjToken = process.env.CJ_TOKEN;
  const cjCompanyId = process.env.CJ_COMPANY_ID;
  const cjPid = process.env.CJ_PID;
  const ebayClientId = process.env.EBAY_CLIENT_ID;
  const rakutenToken = process.env.Rakuten_Token;
  const rakutenSid = process.env.Rakuten_SID;

  console.log('CJ_TOKEN:', cjToken ? 'Set' : 'Missing');
  console.log('CJ_COMPANY_ID:', cjCompanyId ? 'Set' : 'Missing');
  console.log('Rakuten_Token:', rakutenToken ? 'Set' : 'Missing');
  console.log('Rakuten_SID:', rakutenSid ? 'Set' : 'Missing');

  const storesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'public', 'stores.json')));

  // CJ Search
  for (const store of stores.filter(s => storesData.find(si => si.id === s && si.platform === 'cj'))) {
    const storeInfo = storesData.find(s => s.id === store);
    if (!storeInfo || !storeInfo.adId || !cjToken || !cjCompanyId || !cjPid) {
      console.error(`CJ Missing Data for ${store}:`, { adId: storeInfo?.adId, token: !!cjToken, companyId: !!cjCompanyId, pid: !!cjPid });
      results.push({ store: storeInfo?.name || store, error: 'Missing CJ credentials or adId' });
      continue;
    }
    try {
      console.log(`CJ API call for ${store}: companyId=${cjCompanyId}, adId=${storeInfo.adId}`);
      const response = await axios.post(
        'https://ads.api.cj.com/query',
        {
          query: `query { shoppingProducts(companyId: "${cjCompanyId}", keywords: ["${query}"], limit: 5) { resultList { id title price { amount currency } link imageLink } } }`
        },
        {
          headers: {
            'Authorization': `Bearer ${cjToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`CJ Response for ${store}:`, response.data);
      const cjResults = response.data.data.shoppingProducts.resultList.map(item => ({
        store: storeInfo.name,
        name: item.title,
        price: `${item.price.currency} ${item.price.amount}`,
        url: `${item.link}&pid=${cjPid}`,
        image: item.imageLink || '',
        shipping: 'N/A'
      }));
      results.push(...cjResults);
    } catch (error) {
      console.error(`CJ Error for ${store}:`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      results.push({ store: storeInfo.name, error: error.response?.data?.errors?.map(e => e.message).join(', ') || error.message });
    }
  }

  // eBay Search
  if (stores.includes('ebay') && ebayClientId) {
    try {
      const response = await axios.get('https://svcs.ebay.com/services/search/FindingService/v1', {
        params: {
          'OPERATION-NAME': 'findItemsByKeywords',
          'SERVICE-VERSION': '1.0.0',
          'SECURITY-APPNAME': ebayClientId,
          'RESPONSE-DATA-FORMAT': 'JSON',
          'REST-PAYLOAD': true,
          'keywords': query,
          'paginationInput.entriesPerPage': 5
        }
      });
      const ebayResults = response.data.findItemsByKeywordsResponse[0].searchResult[0].item.map(item => ({
        store: 'eBay',
        name: item.title[0],
        price: `USD ${item.sellingStatus[0].currentPrice[0].__value__}`,
        url: item.viewItemURL[0],
        image: item.galleryURL?.[0] || '',
        shipping: item.shippingInfo?.[0]?.shippingServiceCost?.[0]?.__value__ ? `USD ${item.shippingInfo[0].shippingServiceCost[0].__value__}` : 'N/A'
      }));
      results.push(...ebayResults);
    } catch (error) {
      console.error('eBay Error:', error.response?.data || error.message);
      results.push({ store: 'eBay', error: error.response?.data?.errorMessage?.[0]?.error?.[0]?.message || 'Search failed' });
    }
  }

  // Rakuten Search
  for (const store of stores.filter(s => storesData.find(si => si.id === s && si.platform === 'rakuten'))) {
    const storeInfo = storesData.find(s => s.id === store);
    if (!storeInfo || !storeInfo.adId || !rakutenToken || !rakutenSid) {
      console.error(`Rakuten Missing Data for ${store}:`, { adId: storeInfo?.adId, token: !!rakutenToken, sid: !!rakutenSid });
      results.push({ store: storeInfo?.name || store, error: 'Missing Rakuten credentials or adId' });
      continue;
    }
    try {
      console.log(`Rakuten API call for ${store}: token=${rakutenToken.slice(0, 10)}..., sid=${rakutenSid}, mid=${storeInfo.adId}`);
      const response = await axios.get('https://api.linksynergy.com/productsearch/1.0', {
        params: {
          token: rakutenToken,
          sid: rakutenSid,
          mid: storeInfo.adId,
          keyword: query,
          max: 5
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      console.log(`Rakuten Raw Response for ${store}:`, response.data);
      const items = Array.isArray(response.data.item) ? response.data.item : (response.data.item ? [response.data.item] : []);
      if (items.length === 0) {
        console.error(`Rakuten No Items for ${store}:`, response.data);
        results.push({ store: storeInfo.name, error: 'No items found' });
        continue;
      }
      const rakutenResults = items.map(item => ({
        store: storeInfo.name,
        name: item.productname || 'Unknown',
        price: item.price && item.price.currency && item.price['__value__'] ? `${item.price.currency} ${item.price['__value__']}` : 'N/A',
        url: item.linkurl || '',
        image: item.imageurl || '',
        shipping: 'N/A'
      }));
      results.push(...rakutenResults);
    } catch (error) {
      console.error(`Rakuten Error for ${store}:`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      results.push({ store: storeInfo.name, error: error.response?.data?.error_description || 'Search failed' });
    }
  }

  res.json({ items: results });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('CJ_TOKEN:', process.env.CJ_TOKEN ? 'Set' : 'Missing');
  console.log('CJ_COMPANY_ID:', process.env.CJ_COMPANY_ID ? 'Set' : 'Missing');
  console.log('CJ_PID:', process.env.CJ_PID ? 'Set' : 'Missing');
  console.log('EBAY_CLIENT_ID:', process.env.EBAY_CLIENT_ID ? 'Set' : 'Missing');
  console.log('Rakuten_Token:', process.env.Rakuten_Token ? 'Set' : 'Missing');
  console.log('Rakuten_SID:', process.env.Rakuten_SID ? 'Set' : 'Missing');
});
