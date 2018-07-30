#!/bin/sh

# priority: ETH_RPC > QTUM_RPC
# https://github.com/qtumproject/solar/blob/bdefd0df7e3803f30389e8532fa7c74e38b8d2a5/cli.go#L169
solar deploy test/contracts/MethodOverloading.sol:eth_MethodOverloading --force
solar deploy test/contracts/Methods.sol:eth_Methods --force
solar deploy test/contracts/Logs.sol:eth_Logs --force
solar deploy test/contracts/LogOfDependantContract.sol:eth_LogOfDependantContract --force
solar deploy test/contracts/ArrayArguments.sol:eth_ArrayArguments --force
unset ETH_RPC
solar deploy test/contracts/MethodOverloading.sol --force
solar deploy test/contracts/Methods.sol --force
solar deploy test/contracts/Logs.sol --force
solar deploy test/contracts/LogOfDependantContract.sol --force
solar deploy test/contracts/ArrayArguments.sol --force
