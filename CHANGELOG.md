# Changelog

All notable changes to Maiat Dojo will be documented in this file.

## [0.1.0.0] - 2026-04-06

### Added
- ERC-8004 identity minting on BSC via relayer-submitted `registerFor()` transactions
- BAS (BSC Attestation Service) integration for session-close attestations
- BSC AgenticCommerceHooked on-chain job binding for session lifecycle
- Relayer nonce serialization with `withRelayerLock()` mutex across all BSC modules
- `ENABLE_KYA_MINT` feature flag for gradual rollout
- Backfill script for existing users missing on-chain identity
- Vitest test framework with 33 tests covering BSC library guard clauses and regression cases

### Changed
- Migrated chain configuration and branding from Base/EAS to BSC/BAS
- Prisma schema: renamed `easAttestationUid` to `basAttestationUid`
- Seed data rewritten for BSC contract addresses

### Fixed
- Relayer nonce collisions via `withRelayerLock()` serialization
- BAS attestation UID extraction using `parseEventLogs` instead of manual topic parsing
- `getAgentIdOf` no longer silently swallows RPC errors
- Fire-and-forget attestation now properly catches and logs errors
- Vitest glob pattern excludes `contracts/lib` to prevent false test discovery
