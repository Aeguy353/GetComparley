Comparley New
A search comparison site for products from eBay, CJ, and Rakuten stores.
Setup

Install Dependencies:
npm install


Create .env:Add the following to .env in the root:
CJ_TOKEN=OAB5IwQ2dINv0fkwDKgzgRJUzQ
CJ_COMPANY_ID=7568913
CJ_PID=101450363
EBAY_CLIENT_ID=JeffreyW-Comparle-PRD-8f018073b-d1a5c9df
RAKUTEN_APPLICATION_ID=your-rakuten-app-id
RAKUTEN_AFFILIATE_ID=your-rakuten-affiliate-id


Update stores.json:

Replace Rakuten adIds in public/stores.json with real Advertiser IDs from Rakuten’s affiliate dashboard.
Example:{
  "id": "tabio",
  "name": "Tabio",
  "adId": "123456",
  "platform": "rakuten"
}




Run Locally:
node server.js

Visit http://localhost:3000.

Deploy on Render:

Connect to GitHub repo.
Set environment variables in Render.
Use Node.js runtime, start command: npm start.



Structure

server.js: Backend API (Express).
public/: Static files (HTML, CSS, JS, stores.json).
.gitignore: Ignores node_modules and .env.
package.json: Dependencies and scripts.

