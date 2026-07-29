# Release Checklist

- Unit tests, lint, and production build pass.
- Contract tests pass with the pinned SDK.
- Database migrations are applied.
- Mainnet network, Horizon URL, asset issuer, and recipient are reviewed.
- Demo mode is disabled for production settlement.
- Provider credentials remain server-side.
- README and deployment manifest identify the same contract and transaction.
- Bill create, prepare, confirm, and detail routes are smoke-tested.
