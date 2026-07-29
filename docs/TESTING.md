# Testing

Run `npm test` for billing, muxed account, and route behavior. Run
`npm run test:e2e` for the browser journey and `npm run build` before release.

The Soroban tests cover payment creation, confirmation, cancellation, duplicate
IDs, and authorization. Mainnet checks should be read-only and compare the
checked-in manifest with a public explorer.
