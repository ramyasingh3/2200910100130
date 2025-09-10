URL Shortener Microservice

Run locally:

```bash
cd backend-test-submission
npm install
npm run build
PORT=3000 LOG_ENDPOINT=http://20.204.56.144/evaluation-service/logs npm start
```

Endpoints
- POST `/shorturls` → body: `{ url: string, validity?: number, shortcode?: string }`
- GET `/:code` → redirects to original URL and records click
- GET `/shorturls/:code/stats` → returns stats

Notes
- Uses `logging-middleware` for request and error logs.
- In-memory store; expiry and validations per assignment.

