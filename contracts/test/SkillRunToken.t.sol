// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {SkillRunToken} from "../src/SkillRunToken.sol";

contract SkillRunTokenTest is Test {
    SkillRunToken public token;
    address registry = makeAddr("registry");
    address router   = makeAddr("router");
    address agent    = makeAddr("agent");
    address attacker = makeAddr("attacker");

    bytes32 constant SKILL_ID = keccak256("web-scraper");

    function setUp() public {
        token = new SkillRunToken(
            SKILL_ID, registry, router, "Maiat Skill: web-scraper", "MSK-abc123"
        );
    }

    function test_metadata() public view {
        assertEq(token.skillId(), SKILL_ID);
        assertEq(token.registry(), registry);
        assertEq(token.router(), router);
        assertEq(token.decimals(), 0);
        assertEq(token.name(), "Maiat Skill: web-scraper");
        assertEq(token.symbol(), "MSK-abc123");
    }

    function test_mint_onlyRouter() public {
        vm.prank(router);
        token.mint(agent, 5);
        assertEq(token.balanceOf(agent), 5);
        assertEq(token.totalSupply(), 5);
    }

    function test_mint_revertsFromNonRouter() public {
        vm.prank(attacker);
        vm.expectRevert(SkillRunToken.OnlyRouter.selector);
        token.mint(agent, 5);
    }

    function test_burn_onlyRouter() public {
        vm.prank(router);
        token.mint(agent, 5);
        vm.prank(router);
        token.burn(agent, 3);
        assertEq(token.balanceOf(agent), 2);
        assertEq(token.totalSupply(), 2);
    }

    function test_burn_revertsFromNonRouter() public {
        vm.prank(router);
        token.mint(agent, 5);
        vm.prank(attacker);
        vm.expectRevert(SkillRunToken.OnlyRouter.selector);
        token.burn(agent, 1);
    }

    function test_transfer_allowedBetweenAgents() public {
        vm.prank(router);
        token.mint(agent, 5);
        address other = makeAddr("other");
        vm.prank(agent);
        token.transfer(other, 2);
        assertEq(token.balanceOf(agent), 3);
        assertEq(token.balanceOf(other), 2);
    }
}
