# 034 Testnet runbook

Build and deploy `contracts/payment-proof/` through unsigned, simulated XDRs.
After initialization, create one bill payment intent and confirm it only after
the app verifies the exact Horizon payment. Sign all transactions externally
with Freighter and record verified hashes in `payment-proof/deployment.json`.
