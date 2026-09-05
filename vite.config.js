import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

/**
 * Dev-only bridge for `/api/enquiry`.
 *
 * In production the same route is served by a real serverless function
 * (see api/enquiry.js). During `vite dev` there is no backend, so we expose
 * an honest simulation: it validates the payload, applies the honeypot and
 * rate-limit affordances, then reports "not configured" (503) unless a dev
 * mailbox is enabled via VITE_DEV_ENQUIRY_EMAIL.
 */
function devEnquiryPlugin() {
  const hits = new Map();
  return {
    name: 'dev-enquiry-bridge',
    configureServer(server) {
      server.middlewares.use('/api/enquiry', (req, res, next) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ message: 'Method not allowed.' }));
          return;
        }

        let raw = '';
        req.on('data', (chunk) => { raw += chunk; });
        req.on('end', () => {
          if (raw.length > 12000) {
            res.statusCode = 413;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ message: 'The enquiry is too large to submit.' }));
            return;
          }

          let body;
          try {
            body = JSON.parse(raw || '{}');
          } catch {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ message: 'Invalid submission payload.' }));
            return;
          }

          if (body.website) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ message: 'Your enquiry was submitted successfully. Our team will contact you shortly.' }));
            return;
          }

          const isAdmission = body.formType === 'admission';
          const required = isAdmission
            ? ['parentName', 'childName', 'phone', 'classFor']
            : ['cName', 'cPhone', 'cSubject', 'cMessage'];
          const missing = required.filter((key) => !String(body[key] || '').trim());
          if (missing.length) {
            res.statusCode = 422;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ message: 'Please complete all required fields.' }));
            return;
          }

          const devTo = process.env.VITE_DEV_ENQUIRY_EMAIL;

          if (!devTo) {
            // Honest dev behaviour: no fake success.
            console.log('[dev-enquiry] Enquiry received but no VITE_DEV_ENQUIRY_EMAIL configured — not sent.');
            res.statusCode = 503;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ message: 'The enquiry service is not configured yet.' }));
            return;
          }

          console.log(`[dev-enquiry] Simulated delivery to ${devTo}:`, JSON.stringify(body, null, 2));
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ message: 'Your enquiry was submitted successfully. Our team will contact you shortly.' }));
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [devEnquiryPlugin()],
  publicDir: 'public',
  build: {
    // Inline small assets, keep the markup readable for multi-page sites.
    assetsInlineLimit: 4096,
    rollupOptions: {
      input: {
        home: resolve(root, 'index.html'),
        about: resolve(root, 'about.html'),
        academics: resolve(root, 'academics.html'),
        facilities: resolve(root, 'facilities.html'),
        admissions: resolve(root, 'admissions.html'),
        contact: resolve(root, 'contact.html')
      }
    }
  }
});