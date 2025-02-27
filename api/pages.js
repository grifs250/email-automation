import fs from 'fs';
import path from 'path';

// Load templates
const tnxTemplate = fs.readFileSync(
  path.join(process.cwd(), 'views', 'tnx.ejs'),
  'utf8'
);
const indexTemplate = fs.readFileSync(
  path.join(process.cwd(), 'views', 'index.ejs'),
  'utf8'
);

export default function handler(req, res) {
  if (req.method === 'GET') {
    try {
      if (req.url === '/tnx') {
        res.setHeader('Content-Type', 'text/html');
        res.send(renderThanksPage());
      } else {
        // Get error from query params if any
        const error = req.query.error;
        res.setHeader('Content-Type', 'text/html');
        res.send(renderIndexPage({ error }));
      }
    } catch (error) {
      console.error('Page rendering error:', error);
      res.status(500).send('Internal Server Error');
    }
  }
}

function renderThanksPage() {
  return `
    <!DOCTYPE html>
    <html lang="lv">
    <!-- Your tnx.ejs content -->
    ${tnxTemplate}
    </html>
  `;
}

function renderIndexPage(data) {
  return `
    <!DOCTYPE html>
    <html lang="lv">
    <!-- Your index.ejs content -->
    ${indexTemplate}
    </html>
  `;
} 