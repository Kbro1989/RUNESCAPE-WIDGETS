const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Simple static server
const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, req.url === '/' ? 'rs3_unified_widget.html' : req.url);
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  switch (extname) {
    case '.js': contentType = 'text/javascript'; break;
    case '.css': contentType = 'text/css'; break;
    case '.json': contentType = 'application/json'; break;
  }
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(8080, async () => {
  console.log('Server running on port 8080');
  
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  
  await page.goto('http://localhost:8080/');
  
  // Wait a bit to let scripts run
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Stats innerHTML:", await page.evaluate(() => document.getElementById('graph-stats').innerHTML));
  console.log("Count all:", await page.evaluate(() => document.getElementById('count-all').textContent));
  
  await browser.close();
  server.close();
});
