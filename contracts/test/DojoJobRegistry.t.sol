// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/DojoJobRegistry.sol";

contract DojoJobRegistryTest is Test {
    DojoJobRegistry public registry;

    address owner = address(this);
    address buyer = makeAddr("buyer");
    address seller = makeAddr("seller");
    address notOwner = makeAddr("notOwner");

    uint256 constant SKILL_ID = 1;
    uint256 constant AMOUNT = 10e6; // 10 USDC (6 decimals)
    bytes32 constant RESULT_HASH = keccak256("skill-content-delivered");
    bytes32 constant FAIL_REASON = keccak256("delivery-failed");

    function setUp() public {
        registry = new DojoJobRegistry();
    }

    // ── createJob ────────────────────────────────────────────────

    function testCreateJob_success() public {
        uint256 jobId = registry.createJob(SKILL_ID, buyer, seller, AMOUNT);
        assertEq(jobId, 1, "First job should have ID 1");
        assertEq(registry.jobCounter(), 1, "Job counter should be 1");

        DojoJobRegistry.Job memory job = registry.getJob(jobId);
        assertEq(job.skillId, SKILL_ID, "Skill ID mismatch");
        assertEq(job.buyer, buyer, "Buyer mismatch");
        assertEq(job.seller, seller, "Seller mismatch");
        assertEq(job.amount, AMOUNT, "Amount mismatch");
        assertEq(uint256(job.status), uint256(DojoJobRegistry.JobStatus.Created), "Status should be Created");
        assertGt(job.createdAt, 0, "CreatedAt should be set");
        assertEq(job.completedAt, 0, "CompletedAt should be 0");
        assertEq(job.resultHash, bytes32(0), "ResultHash should be empty");
    }

    function testCreateJob_multipleJobs() public {
        uint256 id1 = registry.createJob(1, buyer, seller, AMOUNT);
        uint256 id2 = registry.createJob(2, buyer, seller, AMOUNT * 2);
        uint256 id3 = registry.createJob(3, seller, buyer, AMOUNT * 3);

        assertEq(id1, 1);
        assertEq(id2, 2);
        assertEq(id3, 3);
        assertEq(registry.jobCounter(), 3);
    }

    function testCreateJob_emitsEvent() public {
        vm.expectEmit(true, true, true, true);
        emit DojoJobRegistry.JobCreated(1, SKILL_ID, buyer, seller, AMOUNT, block.timestamp);
        registry.createJob(SKILL_ID, buyer, seller, AMOUNT);
    }

    function testCreateJob_revert_invalidAddress_zeroBuyer() public {
        vm.expectRevert(DojoJobRegistry.InvalidAddress.selector);
        registry.createJob(SKILL_ID, address(0), seller, AMOUNT);
    }

    function testCreateJob_revert_invalidAddress_zeroSeller() public {
        vm.expectRevert(DojoJobRegistry.InvalidAddress.selector);
        registry.createJob(SKILL_ID, buyer, address(0), AMOUNT);
    }

    function testCreateJob_revert_invalidAmount() public {
        vm.expectRevert(DojoJobRegistry.InvalidAmount.selector);
        registry.createJob(SKILL_ID, buyer, seller, 0);
    }

    function testCreateJob_revert_notOwner() public {
        vm.prank(notOwner);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", notOwner));
        registry.createJob(SKILL_ID, buyer, seller, AMOUNT);
    }

    // ── completeJob ──────────────────────────────────────────────

    function testCompleteJob_success() public {
        uint256 jobId = registry.createJob(SKILL_ID, buyer, seller, AMOUNT);

        registry.completeJob(jobId, RESULT_HASH);

        DojoJobRegistry.Job memory job = registry.getJob(jobId);
        assertEq(uint256(job.status), uint256(DojoJobRegistry.JobStatus.Completed), "Status should be Completed");
        assertGt(job.completedAt, 0, "CompletedAt should be set");
        assertEq(job.resultHash, RESULT_HASH, "ResultHash should be set");
    }

    function testCompleteJob_emitsEvent() public {
        uint256 jobId = registry.createJob(SKILL_ID, buyer, seller, AMOUNT);

        vm.expectEmit(true, false, false, true);
        emit DojoJobRegistry.JobCompleted(jobId, RESULT_HASH, block.timestamp);
        registry.completeJob(jobId, RESULT_HASH);
    }

    function testCompleteJob_revert_notFound() public {
        vm.expectRevert(abi.encodeWithSelector(DojoJobRegistry.JobNotFound.selector, 999));
        registry.completeJob(999, RESULT_HASH);
    }

    function testCompleteJob_revert_alreadyCompleted() public {
        uint256 jobId = registry.createJob(SKILL_ID, buyer, seller, AMOUNT);
        registry.completeJob(jobId, RESULT_HASH);

        vm.expectRevert(abi.encodeWithSelector(DojoJobRegistry.JobAlreadyCompleted.selector, jobId));
        registry.completeJob(jobId, RESULT_HASH);
    }

    function testCompleteJob_revert_alreadyFailed() public {
        uint256 jobId = registry.createJob(SKILL_ID, buyer, seller, AMOUNT);
        registry.failJob(jobId, FAIL_REASON);

        vm.expectRevert(abi.encodeWithSelector(DojoJobRegistry.JobAlreadyCompleted.selector, jobId));
        registry.completeJob(jobId, RESULT_HASH);
    }

    function testCompleteJob_revert_notOwner() public {
        uint256 jobId = registry.createJob(SKILL_ID, buyer, seller, AMOUNT);

        vm.prank(notOwner);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", notOwner));
        registry.completeJob(jobId, RESULT_HASH);
    }

    // ── failJob ──────────────────────────────────────────────────

    function test_failJob_success() public {
        uint256 jobId = registry.createJob(SKILL_ID, buyer, seller, AMOUNT);

        registry.failJob(jobId, FAIL_REASON);

        DojoJobRegistry.Job memory job = registry.getJob(jobId);
        assertEq(uint256(job.status), uint256(DojoJobRegistry.JobStatus.Failed), "Status should be Failed");
        assertGt(job.completedAt, 0, "CompletedAt should be set");
        assertEq(job.resultHash, FAIL_REASON, "ResultHash should store fail reason");
    }

    function test_failJob_emitsEvent() public {
        uint256 jobId = registry.createJob(SKILL_ID, buyer, seller, AMOUNT);

        vm.expectEmit(true, false, false, true);
        emit DojoJobRegistry.JobFailed(jobId, FAIL_REASON, block.timestamp);
        registry.failJob(jobId, FAIL_REASON);
    }

    function test_failJob_revert_notFound() public {
        vm.expectRevert(abi.encodeWithSelector(DojoJobRegistry.JobNotFound.selector, 999));
        registry.failJob(999, FAIL_REASON);
    }

    function test_failJob_revert_alreadyCompleted() public {
        uint256 jobId = registry.createJob(SKILL_ID, buyer, seller, AMOUNT);
        registry.completeJob(jobId, RESULT_HASH);

        vm.expectRevert(abi.encodeWithSelector(DojoJobRegistry.JobAlreadyCompleted.selector, jobId));
        registry.failJob(jobId, FAIL_REASON);
    }

    function test_failJob_revert_alreadyFailed() public {
        uint256 jobId = registry.createJob(SKILL_ID, buyer, seller, AMOUNT);
        registry.failJob(jobId, FAIL_REASON);

        vm.expectRevert(abi.encodeWithSelector(DojoJobRegistry.JobAlreadyCompleted.selector, jobId));
        registry.failJob(jobId, bytes32("second-failure"));
    }

    function test_failJob_revert_notOwner() public {
        uint256 jobId = registry.createJob(SKILL_ID, buyer, seller, AMOUNT);

        vm.prank(notOwner);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", notOwner));
        registry.failJob(jobId, FAIL_REASON);
    }

    // ── View functions ───────────────────────────────────────────

    function testGetJob_revert_notFound() public {
        vm.expectRevert(abi.encodeWithSelector(DojoJobRegistry.JobNotFound.selector, 1));
        registry.getJob(1);
    }

    function testGetJobStatus_success() public {
        uint256 jobId = registry.createJob(SKILL_ID, buyer, seller, AMOUNT);

        assertEq(uint256(registry.getJobStatus(jobId)), uint256(DojoJobRegistry.JobStatus.Created));

        registry.completeJob(jobId, RESULT_HASH);
        assertEq(uint256(registry.getJobStatus(jobId)), uint256(DojoJobRegistry.JobStatus.Completed));
    }

    function testGetJobStatus_revert_notFound() public {
        vm.expectRevert(abi.encodeWithSelector(DojoJobRegistry.JobNotFound.selector, 999));
        registry.getJobStatus(999);
    }
}
