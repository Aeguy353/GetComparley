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
  const rakutenAppId = process.env.RAKUTEN_APPLICATION_ID;
  const rakutenAffId = process.env.RAKUTEN_AFFILIATE_ID;

  // Load stores.json to get adIds
  const storesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'public', 'stores.json')));

  // CJ Search
  for (const store of stores.filter(s => storesData.find(si => si.id === s && si.platform === 'cj'))) {
    const storeInfo = storesData.find(s => s.id === store);
    if (!storeInfo || !storeInfo.adId || !cjToken || !cjCompanyId || !cjPid) {
      results.push({ store: storeInfo?.name || store, error: 'Missing CJ credentials or adId' });
      continue;
    }
    try {
      const response = await axios.post(
        'https://ads.api.cj.com/query',
        {
          query: `query { shoppingProducts(companyId: "${cjCompanyId}", partnerIds: ["${storeInfo.adId}"], keywords: ["${query}"], limit: 5) { resultList { id title price { amount currency } link { url } } } }`
        },
        {
          headers: {
            'Authorization': `Bearer ${cjToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const cjResults = response.data.data.shoppingProducts.resultList.map(item => ({
        store: storeInfo.name,
        name: item.title,
        price: `${item.price.currency} ${item.price.amount}`,
        url: `${item.link.url}&pid=${cjPid}`
      }));
      results.push(...cjResults);
    } catch (error) {
      console.error(`CJ Error for ${store}:`, error.response?.data || error.message);
      results.push({ store: storeInfo.name, error: error.response?.data?.errors?.map(e => e.message).join(', ') || 'Search failed' });
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
        url: item.viewItemURL[0]
      }));
      results.push(...ebayResults);
    } catch (error) {
      console.error('eBay Error:', error.response?.data || error.message);
      results.push({ store: 'eBay', error: error.response?.data?.errorMessage?.[0]?.error?.[0]?.message || 'Search failed' });
    }
  }

  // Rakuten Search
  for (const store of stores.filter(s => storesData.find(si => si.id === s && si.platform === 'rakuten'))) {
    const storeInfo = storesData.find(s => s.id
