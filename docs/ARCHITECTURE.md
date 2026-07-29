# Architecture

The Next.js application owns bill discovery, quotes, access control, payment
preparation, and provider reconciliation. Freighter signs the Stellar envelope
outside the server. Confirmation verifies settlement against Horizon before a
bill can move to paid.

The Soroban contract stores payment-proof state. PostgreSQL stores bill and
provider workflow data; demo mode uses an ephemeral in-memory adapter.
