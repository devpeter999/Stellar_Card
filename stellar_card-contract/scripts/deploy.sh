#!/bin/bash
set -e

# Deploy script for Stellar_Card receiver contract to testnet

NETWORK="testnet"
CONTRACT_NAME="stellar_card_receiver"
WASM_PATH="../target/wasm32-unknown-unknown/release/stellar_card_receiver.wasm"
IDENTITY="deployer"

echo "Building the contract..."
cd "$(dirname "$0")"
cd ..
cargo build --target wasm32-unknown-unknown --release

if [ ! -f "$WASM_PATH" ]; then
  echo "Error: WASM file not found at $WASM_PATH"
  exit 1
fi

echo "Deploying contract to $NETWORK..."
CONTRACT_ID=$(stellar contract deploy \
  --wasm "$WASM_PATH" \
  --source "$IDENTITY" \
  --network "$NETWORK")

echo "Contract deployed successfully!"
echo "Contract ID: $CONTRACT_ID"

# Save the contract ID to a file for frontend/backend to use
echo "$CONTRACT_ID" > .contract_id
echo "Contract ID saved to .contract_id"
