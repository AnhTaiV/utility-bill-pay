# Contract Interface

- `initialize(admin)` configures the administrative signer.
- `create_payment(payment_id, payer, amount)` records a pending bill payment.
- `confirm_payment(payment_id, tx_hash)` records verified settlement evidence.
- `cancel_payment(payment_id)` closes an unsettled payment.
- read methods expose the stored payment and status.

Bill-provider confirmation remains an application responsibility and is not
represented as blockchain settlement.
