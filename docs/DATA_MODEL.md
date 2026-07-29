# Data Model

Bills contain a provider reference, category, amount, due date, payer, and
lifecycle status. Payment intent fields store the expected Stellar network,
asset, recipient, memo, digest, and confirmed transaction hash.

On-chain payment IDs map to bills without exposing customer account details.
Provider reconciliation metadata remains off-chain.
