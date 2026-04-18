// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice USDC-like ERC20 with a per-address blacklist. If either party is
///         blacklisted, the underlying transfer reverts. Mirrors Circle's
///         behaviour on BSC mainnet — used in audit regression tests for
///         the pull-payment fallback path (finding #4).
contract MockBlacklistUSDC is ERC20 {
    mapping(address => bool) public blacklisted;

    constructor() ERC20("USD Coin", "USDC") {}

    function decimals() public pure override returns (uint8) { return 6; }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function setBlacklisted(address who, bool isBlacklisted) external {
        blacklisted[who] = isBlacklisted;
    }

    function _update(address from, address to, uint256 value) internal override {
        require(!blacklisted[from], "BLACKLIST: from");
        require(!blacklisted[to],   "BLACKLIST: to");
        super._update(from, to, value);
    }
}
