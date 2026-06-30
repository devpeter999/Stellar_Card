#!/bin/bash
set -euo pipefail

# Deployment script for Stellar_Card contract to testnet (or other configured network)
#
# Requirements:
# - soroban-cli installed
# - Rust toolchain (with wasm32-unknown-unknown target) installed
#
# Required Environment Variables:
# - SOURCE_ACCOUNT: The identity name or secret key to deploy with.
#
# Optional Environment Variables:
# - NETWORK: The network to deploy to (default: testnet)

NETWORK="${NETWORK:-testnet}"

echo "============================================="
echo "   Stellar_Card Contract Deployment Script   "
echo "============================================="

# 1. Validate environment
if [[ -z "${SOURCE_ACCOUNT:-}" ]]; then
    echo "❌ ERROR: SOURCE_ACCOUNT environment variable is not set."
    echo "Please set SOURCE_ACCOUNT to your configured identity name or secret key."
    echo "Example: export SOURCE_ACCOUNT=alice"
    exit 1
fi

if ! command -v soroban &> /dev/null; then
    echo "❌ ERROR: soroban-cli could not be found. Please install it first."
    exit 1
fi

# 2. Build the contract
echo "🚀 Building contract..."

# Navigate to the contract directory relative to this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
CONTRACT_DIR="$PROJECT_ROOT/stellar_card-contract"

cd "$CONTRACT_DIR"
soroban contract build

WASM_FILE="target/wasm32-unknown-unknown/release/stellar_card_receiver.wasm"

if [[ ! -f "$WASM_FILE" ]]; then
    echo "❌ ERROR: WASM build failed, file not found at $WASM_FILE"
    exit 1
fi

echo "✅ Build successful!"

# 3. Deploy the contract
echo "🚀 Deploying contract to network: ${NETWORK}..."

# Deploy and capture output (contract address)
CONTRACT_ID=$(soroban contract deploy \
    --wasm "$WASM_FILE" \
    --source "$SOURCE_ACCOUNT" \
    --network "$NETWORK")

if [[ -z "$CONTRACT_ID" ]]; then
    echo "❌ ERROR: Deployment failed or returned empty contract ID."
    exit 1
fi

echo "============================================="
echo "✅ Deployment completed successfully!"
echo "📍 Contract Address: $CONTRACT_ID"
echo "============================================="
echo "Please save this contract address for initialization and frontend configuration."
