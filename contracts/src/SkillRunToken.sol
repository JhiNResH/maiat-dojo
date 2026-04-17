// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title SkillRunToken
 * @notice One-execution-credit ERC-20 deployed per skill.
 *
 * @dev Semantic contract: `1 token = 1 execution`. No fractions (decimals = 0).
 *      Mint/burn restricted to the SwapRouter — the router enforces payment on
 *      mint and reputation-gated execution on burn.
 *
 * @dev Transferable — agents may gift / resell unused credits. This is a
 *      capability token, not a governance or speculative asset. Pricing is set by
 *      the provider via SkillRegistry; market-based price discovery is out of
 *      scope (see ADR 2026-04-16).
 */
contract SkillRunToken is ERC20 {
    /// @notice keccak256 slug of the skill this token represents.
    bytes32 public immutable skillId;

    /// @notice SkillRegistry that deployed this token.
    address public immutable registry;

    /// @notice Only address authorised to mint/burn.
    address public immutable router;

    error OnlyRouter();

    constructor(
        bytes32 skillId_,
        address registry_,
        address router_,
        string memory name_,
        string memory symbol_
    ) ERC20(name_, symbol_) {
        skillId  = skillId_;
        registry = registry_;
        router   = router_;
    }

    /// @dev `decimals = 0` — integer executions only.
    function decimals() public pure override returns (uint8) {
        return 0;
    }

    /// @notice Mint `amount` tokens to `to`. Router-only.
    function mint(address to, uint256 amount) external {
        if (msg.sender != router) revert OnlyRouter();
        _mint(to, amount);
    }

    /// @notice Burn `amount` tokens from `from`. Router-only.
    function burn(address from, uint256 amount) external {
        if (msg.sender != router) revert OnlyRouter();
        _burn(from, amount);
    }
}
