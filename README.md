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
RAKUTEN_APPLICATION_ID=de7354bd89fd2d94d0c786ac975aaa204642f5afd93f5cc40d16948426269a84
RAKUTEN_AFFILIATE_ID=Kay*nyAx*tw


Run Locally:
node server.js

Visit http://localhost:3000.

Deploy on Render:

Connect to GitHub repo.
Set environment variables in Render as in .env.
Use Node.js runtime, start command: npm start.



Structure

server.js: Backend API (Express).
public/: Static files (HTML, CSS, JS, stores.json).
.gitignore: Ignores node_modules and .env.
package.json: Dependencies and scripts.

