# Environment Configuration

A production deployment requires `DEMO_MODE=false`, `STELLAR_NETWORK=public`,
PostgreSQL, a Horizon endpoint, the approved public asset issuer, and explicit
recipient settings.

Database URLs, provider credentials, token secrets, and signing material are
server-only. Browser variables may expose public network and contract
identifiers but no operational secrets.
