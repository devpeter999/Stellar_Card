# Changelog

All notable changes to the stellar_card SDK are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.7] - 2025-01-01

### Added
- Typed pagination utilities (`PaginatedResult`, `PaginationCursor`, `paginate`)
- Browser-safe entry point (`stellar_card/browser`) excluding Node.js-only modules
- Custom Horizon URL override (`horizonUrl`) in `PayOpts` and `PayViaContractOwsOpts`
- `NetworkConfig` type and `resolveNetworkConfig` helper for managing RPC endpoints
- Automated CI/CD pipeline improvements: version verification, CHANGELOG extraction, Slack notifications

### Fixed
- `publish.yml` notify job now correctly forwards version output from the publish job
- `Verify version matches package.json` step handles manual dispatch without a version input

### Changed
- `PayOpts.sorobanRpcUrl` and new `PayOpts.horizonUrl` allow full custom network configuration
- `purchaseCard` and `purchaseCardOWS` accept `horizonUrl` for end-to-end custom network support

## [0.4.6] - 2024-12-01

### Added
- Initial pagination utilities (`listOrdersPage`, `iterateOrders`) on `Stellar_CardClient`
- SSE-first card wait with polling fallback

### Fixed
- CRLF normalization in SSE stream reader
- SSE buffer cap (1 MB) to prevent OOM on adversarial streams
- Shared deadline between SSE and polling fallback prevents 2× timeout

## [0.4.0] - 2024-10-01

### Added
- `Stellar_CardClient` REST API client with full order lifecycle
- Soroban contract payment helpers (`buildContractPaymentTx`, `submitSorobanTx`)
- OWS-custody wallet support (`payViaContractOWS`, `purchaseCardOWS`)
- Structured error types (`SpendLimitError`, `RateLimitError`, etc.)
- Exponential backoff retry with `Retry-After` header support
- CLI onboarding flow (`stellar_card onboard`)
- MCP tool integration
