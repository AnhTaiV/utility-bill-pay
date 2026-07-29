# Security Model

The server never receives wallet secret keys. It prepares unsigned XDR and
validates the signed transaction's network, source, recipient, asset issuer,
amount, memo, signature, and Horizon success.

Bill access tokens limit disclosure, and idempotency keys prevent duplicate
preparation. Provider callbacks are not sufficient proof of blockchain
settlement and must be reconciled independently.
