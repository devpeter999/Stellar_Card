#!/bin/bash
set -euo pipefail

# Deploy script for Stellar_Card receiver contract to testnet
# Usage: ./scripts/deploy.sh [--network testnet|mainnet|futurenet] [--identity <name>]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONTRACT_DIR="$(dirname "$SCRIPT_DIR")"

NETWORK="testnet"
IDENTITY="deployer"
CONTRACT_NAME="stellar_card_receiver"
WASM_DIR="$CONTRACT_DIR/target/wasm32-unknown-unknown/release"
WASM_PATH="$WASM_DIR/${CONTRACT_NAME}.wasm"
OPTIMIZED_DIR="$CONTRACT_DIR/target/optimized"
OPTIMIZED_WASM_PATH="$OPTIMIZED_DIR/${CONTRACT_NAME}.optimized.wasm"

usage() {
  echo "Usage: $0 [--network testnet|mainnet|futurenet] [--identity <name>]"
  echo ""
  echo "Options:"
  echo "  --network    Network to deploy to (default: testnet)"
  echo "  --identity   Stellar identity/keypair name to use (default: deployer)"
  exit 1
}

while [[ $# -gt 0 ]]; do
  case $1 in
    --network)
      NETWORK="$2"
      shift 2
      ;;
    --identity)
      IDENTITY="$2"
      shift 2
      ;;
    -h|--help)
      usage
      ;;
    *)
      echo "Unknown option: $1"
      usage
      ;;
  esac
done

if [[ "$NETWORK" != "testnet" && "$NETWORK" != "mainnet" && "$NETWORK" != "futurenet" ]]; then
  echo "Error: Invalid network '$NETWORK'. Must be testnet, mainnet, or futurenet."
  exit 1
fi

echo "=== Stellar_Card Contract Deployment ==="
echo "Network:    $NETWORK"
echo "Identity:   $IDENTITY"
echo ""

echo "[1/4] Building WASM..."
cd "$CONTRACT_DIR"
cargo build --target wasm32-unknown-unknown --release

if [[ ! -f "$WASM_PATH" ]]; then
  echo "Error: WASM file not found at $WASM_PATH"
  exit 1
fi
echo "  Build complete: $WASM_PATH"

echo "[2/4] Optimizing WASM..."
mkdir -p "$OPTIMIZED_DIR"
stellar contract optimize \
  --wasm "$WASM_PATH" \
  --output "$OPTIMIZED_WASM_PATH"

WASM_SIZE=$(wc -c < "$OPTIMIZED_WASM_PATH" | tr -d ' ')
echo "  Optimized size: $WASM_SIZE bytes"

echo "[3/4] Deploying contract to $NETWORK..."
CONTRACT_ID=$(stellar contract deploy \
  --wasm "$OPTIMIZED_WASM_PATH" \
  --source "$IDENTITY" \
  --network "$NETWORK")

echo "  Contract ID: $CONTRACT_ID"

echo "[4/4] Saving contract ID..."
echo "$CONTRACT_ID" > "$CONTRACT_DIR/.contract_id"
echo "  Saved to .contract_id"

echo ""
echo "=== Deployment Complete ==="
echo "Contract ID: $CONTRACT_ID"
echo "Network:     $NETWORK"
echo ""
echo "Next step: Initialize the contract with:"
echo "  ./scripts/init.sh --network $NETWORK --contract-id $CONTRACT_ID"
