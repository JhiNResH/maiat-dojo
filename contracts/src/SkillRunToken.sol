// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface ISkillRegistryRouter {
    function router() external view returns (address);
}

/**
 * @title SkillRunToken
 * @notice One-execution-credit ERC-20 deployed per skill.
 *
 * @dev Semantic contract: `1 token = 1 execution`. No fractions (decimals = 0).
 *      Mint/burn restricted to the router authorised by {registry}. The router
 *      is resolved dynamically via `registry.router()` — this lets the registry
 *      rotate SwapRouter implementations without orphaning previously-deployed
 *      skill tokens (audit finding #5, 2026-04-17).
 *
 * @dev Transferable — agents may gift / resell unused credits. Capability token,
 *      not a governance or speculative asset. Pricing set by provider via
 *      SkillRegistry; market-based price discovery is out of scope (ADR 2026-04-16).
 */
contract SkillRunToken is ERC20 {
    /// @notice keccak256 slug of the skill this token represents.
    bytes32 public immutable skillId;

    /// @notice SkillRegistry that deployed this token (authoritative source of router).
    address public immutable registry;

    error OnlyRouter();

    constructor(
        bytes32 skillId_,
        address registry_,
        string memory name_,
        string memory symbol_
    ) ERC20(name_, symbol_) {
        skillId  = skillId_;
        registry = registry_;
    }

    /// @notice Current authorised router (resolved from registry at call time).
    function router() public view returns (address) {
        return ISkillRegistryRouter(registry).router();
    }

    /// @dev `decimals = 0` — integer executions only.
    function decimals() public pure override returns (uint8) {
        return 0;
    }

    /// @notice Mint `amount` tokens to `to`. Router-only (resolved live).
    function mint(address to, uint256 amount) external {
        if (msg.sender != router()) revert OnlyRouter();
        _mint(to, amount);
    }

    /// @notice Burn `amount` tokens from `from`. Router-only (resolved live).
    /// @dev If burning from a third-party address (not msg.sender), check
    ///      allowance so the router cannot burn arbitrary holders' tokens
    ///      without their approval.
    function burn(address from, uint256 amount) external {
        if (msg.sender != router()) revert OnlyRouter();
        if (from != msg.sender) _spendAllowance(from, msg.sender, amount);
        _burn(from, amount);
    }
}
