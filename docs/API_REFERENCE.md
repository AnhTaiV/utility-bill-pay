# API Reference

- `GET /api/billers` lists supported billers.
- `POST /api/bills` creates a bill and one-time access token.
- `GET /api/bills/:id` returns an authorized bill view.
- `POST /api/bills/:id/prepare` returns unsigned payment XDR.
- `POST /api/bills/:id/confirm` verifies a submitted transaction.
- `GET /api/rates` returns settlement quote data.
- `GET /api/events` returns recent payment events.
- `GET /api/health` reports readiness.
