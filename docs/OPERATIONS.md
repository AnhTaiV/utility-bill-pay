# Operations

Monitor health, Horizon latency, payment confirmation errors, provider callback
delay, and paid-but-unreconciled bills. Use the bill ID and transaction hash as
correlation identifiers without logging access tokens.

Retries must preserve the original idempotency key. Query Horizon and provider
status before changing a payment from an uncertain state.
