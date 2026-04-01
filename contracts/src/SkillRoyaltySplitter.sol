// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface ISkillNFT {
    function getCreator(uint256 skillId) external view returns (address);
}

/**
 * @title SkillRoyaltySplitter
 * @notice Splits Agent Services payments between operator, skill creator, and platform.
 *         Used for x402 / MPP / direct service payments.
 *
 *         Default split: 80% operator / 15% creator / 5% platform
 */
contract SkillRoyaltySplitter is Ownable {
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

    // ── Constructor ────────────────────────────────────────
    constructor(
        address _usdc,
        address _skillNft,
        address _platformWallet
    ) Ownable(msg.sender) {
        require(_usdc != address(0), "zero usdc");
        require(_skillNft != address(0), "zero skillNft");
        require(_platformWallet != address(0), "zero platform");
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
    function pay(uint256 skillId, address operator, uint256 amount) external {
        require(operator != address(0), "zero operator");
        require(amount > 0, "zero amount");

        address creator = skillNft.getCreator(skillId);
        require(creator != address(0), "skill !exist");

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
     * @notice Update fee split. Must sum to 10000.
     */
    function setFeeSplit(uint16 _operatorBps, uint16 _creatorBps, uint16 _platformBps) external onlyOwner {
        require(uint256(_operatorBps) + _creatorBps + _platformBps == 10000, "must sum 10000");
        require(_operatorBps >= 5000, "operator < 50%");
        operatorBps = _operatorBps;
        creatorBps = _creatorBps;
        platformBps = _platformBps;
    }

    function setPlatformWallet(address _wallet) external onlyOwner {
        require(_wallet != address(0), "zero");
        platformWallet = _wallet;
    }
}
