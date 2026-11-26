const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('rs3_unified_widget.html', 'utf8');

const dom = new JSDOM(html, { 
  runScripts: "dangerously",
  resources: "usable",
  url: "file:///" + __dirname.replace(/\\/g, '/') + "/"
});

// Mock fetch for local JSON files
dom.window.fetch = async (url) => {
  try {
    const path = url.replace('file:///' + __dirname.replace(/\\/g, '/') + '/', '');
    const data = fs.readFileSync(path, 'utf8');
    return {
      ok: true,
      json: async () => JSON.parse(data)
    };
  } catch (err) {
    return { ok: false, status: 404 };
  }
};

// Mock canvas
dom.window.HTMLCanvasElement.prototype.getContext = () => ({
  setTransform: () => {},
  clearRect: () => {},
  beginPath: () => {},
  arc: () => {},
  fill: () => {},
  stroke: () => {},
  fillText: () => {},
  moveTo: () => {},
  lineTo: () => {},
  measureText: () => ({ width: 10 }),
});

dom.window.onerror = function (msg, source, lineNo, columnNo, error) {
  console.error("Window Error:", msg, 'at', lineNo + ':' + columnNo);
  if (error) {
    console.error(error.stack);
  }
  return true;
};

dom.window.addEventListener('unhandledrejection', function(event) {
  console.error("Unhandled Promise Rejection:", event.reason);
});

setTimeout(() => {
  console.log("Checking if tabs are active...");
  console.log("Graph Stats innerHTML:", dom.window.document.getElementById('graph-stats').innerHTML);
}, 2000);
