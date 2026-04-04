// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DojoJobRegistry
 * @notice Minimal ERC-8183-compatible job registry for Maiat Dojo skill purchases
 * @dev Phase 1: Owner-only job completion (Maiat as evaluator)
 *
 * ERC-8183 defines a standard for on-chain job records in agent economies.
 * Each job represents a skill purchase: buyer pays → content delivered → job completed.
 */
contract DojoJobRegistry is Ownable {
    // ─── Types ───────────────────────────────────────────────────────────────────

    enum JobStatus {
        Created,    // 0: Job created, payment received
        Completed,  // 1: Job completed successfully
        Failed      // 2: Job failed (refund scenario)
    }

    struct Job {
        uint256 skillId;      // On-chain skill ID (SkillNFT tokenId)
        address buyer;        // Buyer address
        address seller;       // Creator/seller address
        uint256 amount;       // Payment amount in USDC (6 decimals)
        JobStatus status;     // Current job status
        uint256 createdAt;    // Block timestamp when created
        uint256 completedAt;  // Block timestamp when completed (0 if not)
        bytes32 resultHash;   // Hash of the result/content delivered
    }

    // ─── State ───────────────────────────────────────────────────────────────────

    /// @notice Mapping of job ID to Job struct
    mapping(uint256 => Job) public jobs;

    /// @notice Counter for job IDs (starts at 1)
    uint256 public jobCounter;

    // ─── Events ──────────────────────────────────────────────────────────────────

    event JobCreated(
        uint256 indexed jobId,
        uint256 indexed skillId,
        address indexed buyer,
        address seller,
        uint256 amount,
        uint256 timestamp
    );

    event JobCompleted(
        uint256 indexed jobId,
        bytes32 resultHash,
        uint256 timestamp
    );

    event JobFailed(
        uint256 indexed jobId,
        bytes32 reason,
        uint256 timestamp
    );

    // ─── Errors ──────────────────────────────────────────────────────────────────

    error JobNotFound(uint256 jobId);
    error JobAlreadyCompleted(uint256 jobId);
    error InvalidAddress();
    error InvalidAmount();

    // ─── Constructor ─────────────────────────────────────────────────────────────

    constructor() Ownable(msg.sender) {
        jobCounter = 0;
    }

    // ─── External Functions ──────────────────────────────────────────────────────

    /**
     * @notice Create a new job record for a skill purchase
     * @param skillId The on-chain skill ID (SkillNFT tokenId)
     * @param buyer The buyer's address
     * @param seller The seller's (creator's) address
     * @param amount The payment amount in USDC smallest units (6 decimals)
     * @return jobId The newly created job ID
     */
    function createJob(
        uint256 skillId,
        address buyer,
        address seller,
        uint256 amount
    ) external onlyOwner returns (uint256 jobId) {
        if (buyer == address(0) || seller == address(0)) {
            revert InvalidAddress();
        }
        if (amount == 0) {
            revert InvalidAmount();
        }

        jobCounter++;
        jobId = jobCounter;

        jobs[jobId] = Job({
            skillId: skillId,
            buyer: buyer,
            seller: seller,
            amount: amount,
            status: JobStatus.Created,
            createdAt: block.timestamp,
            completedAt: 0,
            resultHash: bytes32(0)
        });

        emit JobCreated(jobId, skillId, buyer, seller, amount, block.timestamp);
    }

    /**
     * @notice Mark a job as completed with result hash
     * @dev Only callable by owner (Maiat as evaluator in Phase 1)
     * @param jobId The job ID to complete
     * @param resultHash Hash of the delivered content/result
     */
    function completeJob(uint256 jobId, bytes32 resultHash) external onlyOwner {
        Job storage job = jobs[jobId];

        if (job.createdAt == 0) {
            revert JobNotFound(jobId);
        }
        if (job.status != JobStatus.Created) {
            revert JobAlreadyCompleted(jobId);
        }

        job.status = JobStatus.Completed;
        job.completedAt = block.timestamp;
        job.resultHash = resultHash;

        emit JobCompleted(jobId, resultHash, block.timestamp);
    }

    /**
     * @notice Mark a job as failed
     * @dev Only callable by owner. Used for refund scenarios.
     * @param jobId The job ID to mark as failed
     * @param reason Hash/code explaining the failure
     */
    function failJob(uint256 jobId, bytes32 reason) external onlyOwner {
        Job storage job = jobs[jobId];

        if (job.createdAt == 0) {
            revert JobNotFound(jobId);
        }
        if (job.status != JobStatus.Created) {
            revert JobAlreadyCompleted(jobId);
        }

        job.status = JobStatus.Failed;
        job.completedAt = block.timestamp;
        job.resultHash = reason;

        emit JobFailed(jobId, reason, block.timestamp);
    }

    // ─── View Functions ──────────────────────────────────────────────────────────

    /**
     * @notice Get full job details
     * @param jobId The job ID to query
     * @return The Job struct
     */
    function getJob(uint256 jobId) external view returns (Job memory) {
        if (jobs[jobId].createdAt == 0) {
            revert JobNotFound(jobId);
        }
        return jobs[jobId];
    }

    /**
     * @notice Get job status
     * @param jobId The job ID to query
     * @return The job status enum value
     */
    function getJobStatus(uint256 jobId) external view returns (JobStatus) {
        if (jobs[jobId].createdAt == 0) {
            revert JobNotFound(jobId);
        }
        return jobs[jobId].status;
    }
}
