# Biller Integration

A biller adapter must support account lookup, payment submission, idempotent
status lookup, and durable provider references. Treat request timeout as
unknown, not failed.

Submit a provider payment only after Stellar settlement is verified. Query the
provider before retrying to avoid paying the same bill twice.
