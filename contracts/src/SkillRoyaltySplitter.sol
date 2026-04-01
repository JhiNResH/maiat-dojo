// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ISkillNFT {
    function getCreator(uint256 skillId) external view returns (address);
}

/**
 * @title SkillRoyaltySplitter
 * @notice Splits Agent Services payments between operator, skill creator, and platform.
 *         Used for x402 / MPP / direct service payments.
 *
 *         Default split: 80% operator / 15% creator / 5% platform
 *
 * @dev Audit fixes applied:
 *      - C-02: ReentrancyGuard on pay()
 *      - M-05: Consistent custom errors
 *      - L-02: FeeSplitUpdated event
 *      - L-03: PlatformWalletUpdated event
 */
contract SkillRoyaltySplitter is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ── State ──────────────────────────────────────────────
    IERC20    public immutable usdc;
    ISkillNFT public immutable skillNft;

    uint16 public operatorBps = 8000;   // 80%
    uint16 public creatorBps  = 1500;   // 15%
    uint16 public platformBps = 500;    // 5%
    address public platformWallet;

    // ── Events ─────────────────────────────────────────────
    event ServicePayment(
        uint256 indexed skillId,
        address indexed operator,
        address indexed creator,
        uint256 amount,
        uint256 operatorAmt,
        uint256 creatorAmt,
        uint256 platformAmt
    );

    event FeeSplitUpdated(uint16 operatorBps, uint16 creatorBps, uint16 platformBps);
    event PlatformWalletUpdated(address newWallet);

    // ── Errors ─────────────────────────────────────────────
    error InvalidAddress();
    error ZeroAmount();
    error InvalidSkill(uint256 skillId);
    error InvalidFeeSplit();
    error OperatorBpsTooLow();

    // ── Constructor ────────────────────────────────────────
    constructor(
        address _usdc,
        address _skillNft,
        address _platformWallet
    ) Ownable(msg.sender) {
        if (_usdc == address(0) || _skillNft == address(0) || _platformWallet == address(0)) {
            revert InvalidAddress();
        }
        usdc = IERC20(_usdc);
        skillNft = ISkillNFT(_skillNft);
        platformWallet = _platformWallet;
    }

    // ── Payment ────────────────────────────────────────────

    /**
     * @notice Pay for an agent service. Caller pays USDC, splits to operator/creator/platform.
     * @param skillId  The skill being used (to look up creator for royalty)
     * @param operator The agent operator running the service
     * @param amount   Total USDC amount (6 decimals)
     */
    function pay(uint256 skillId, address operator, uint256 amount) external nonReentrant {
        if (operator == address(0)) revert InvalidAddress();
        if (amount == 0) revert ZeroAmount();

        address creator = skillNft.getCreator(skillId);
        if (creator == address(0)) revert InvalidSkill(skillId);

        uint256 operatorAmt = (amount * operatorBps) / 10000;
        uint256 creatorAmt  = (amount * creatorBps) / 10000;
        uint256 platformAmt = amount - operatorAmt - creatorAmt;

        usdc.safeTransferFrom(msg.sender, operator, operatorAmt);
        usdc.safeTransferFrom(msg.sender, creator, creatorAmt);
        usdc.safeTransferFrom(msg.sender, platformWallet, platformAmt);

        emit ServicePayment(skillId, operator, creator, amount, operatorAmt, creatorAmt, platformAmt);
    }

    // ── Admin setters ──────────────────────────────────────

    /**
     * @notice Update fee split. Must sum to 10000. Operator must be >= 50%.
     */
    function setFeeSplit(uint16 _operatorBps, uint16 _creatorBps, uint16 _platformBps) external onlyOwner {
        if (uint256(_operatorBps) + _creatorBps + _platformBps != 10000) revert InvalidFeeSplit();
        if (_operatorBps < 5000) revert OperatorBpsTooLow();
        operatorBps = _operatorBps;
        creatorBps = _creatorBps;
        platformBps = _platformBps;
        emit FeeSplitUpdated(_operatorBps, _creatorBps, _platformBps);
    }

    function setPlatformWallet(address _wallet) external onlyOwner {
        if (_wallet == address(0)) revert InvalidAddress();
        platformWallet = _wallet;
        emit PlatformWalletUpdated(_wallet);
    }
}
