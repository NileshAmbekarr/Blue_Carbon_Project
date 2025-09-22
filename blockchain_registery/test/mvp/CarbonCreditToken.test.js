const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("CarbonCreditToken", function () {
  async function deployCarbonCreditTokenFixture() {
    const [admin, issuer, user1, user2, beneficiary] = await ethers.getSigners();

    const baseURI = "https://ipfs.io/ipfs/";
    const CarbonCreditToken = await ethers.getContractFactory("CarbonCreditToken");
    const token = await CarbonCreditToken.deploy(baseURI, admin.address);

    // Grant issuer role
    await token.connect(admin).grantIssuerRole(issuer.address);

    return { token, admin, issuer, user1, user2, beneficiary, baseURI };
  }

  describe("Deployment", function () {
    it("Should set the correct admin and base URI", async function () {
      const { token, admin, baseURI } = await loadFixture(deployCarbonCreditTokenFixture);
      
      const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
      expect(await token.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
      expect(await token.uri(1)).to.equal(baseURI);
    });

    it("Should start with token ID 1", async function () {
      const { token } = await loadFixture(deployCarbonCreditTokenFixture);
      
      expect(await token.getCurrentTokenId()).to.equal(1);
    });

    it("Should grant issuer role correctly", async function () {
      const { token, issuer } = await loadFixture(deployCarbonCreditTokenFixture);
      
      const ISSUER_ROLE = await token.ISSUER_ROLE();
      expect(await token.hasRole(ISSUER_ROLE, issuer.address)).to.be.true;
    });
  });

  describe("Minting", function () {
    it("Should mint credits successfully", async function () {
      const { token, issuer, user1 } = await loadFixture(deployCarbonCreditTokenFixture);
      
      const projectId = ethers.keccak256(ethers.toUtf8Bytes("PROJECT_001"));
      const mrvId = ethers.keccak256(ethers.toUtf8Bytes("MRV_001"));
      const amount = ethers.parseUnits("100", 0);
      const vintage = 2023;
      const metadataHash = "QmTestMetadata123";

      await expect(
        token.connect(issuer).mintBatch(user1.address, projectId, mrvId, amount, vintage, metadataHash)
      )
        .to.emit(token, "CreditsMinted")
        .withArgs(1, projectId, mrvId, amount, user1.address, metadataHash, vintage);

      expect(await token.balanceOf(user1.address, 1)).to.equal(amount);
      expect(await token.getCurrentTokenId()).to.equal(2);
    });

    it("Should store batch information correctly", async function () {
      const { token, issuer, user1 } = await loadFixture(deployCarbonCreditTokenFixture);
      
      const projectId = ethers.keccak256(ethers.toUtf8Bytes("PROJECT_001"));
      const mrvId = ethers.keccak256(ethers.toUtf8Bytes("MRV_001"));
      const amount = ethers.parseUnits("100", 0);
      const vintage = 2023;
      const metadataHash = "QmTestMetadata123";

      await token.connect(issuer).mintBatch(user1.address, projectId, mrvId, amount, vintage, metadataHash);

      const batch = await token.getBatchInfo(1);
      expect(batch.projectId).to.equal(projectId);
      expect(batch.mrvId).to.equal(mrvId);
      expect(batch.vintage).to.equal(vintage);
      expect(batch.metadataIpfsHash).to.equal(metadataHash);
      expect(batch.totalIssued).to.equal(amount);
      expect(batch.totalRetired).to.equal(0);
      expect(batch.issuer).to.equal(issuer.address);
      expect(batch.exists).to.be.true;
    });

    it("Should add token to project tokens list", async function () {
      const { token, issuer, user1 } = await loadFixture(deployCarbonCreditTokenFixture);
      
      const projectId = ethers.keccak256(ethers.toUtf8Bytes("PROJECT_001"));
      const mrvId = ethers.keccak256(ethers.toUtf8Bytes("MRV_001"));
      const amount = ethers.parseUnits("100", 0);
      const vintage = 2023;
      const metadataHash = "QmTestMetadata123";

      await token.connect(issuer).mintBatch(user1.address, projectId, mrvId, amount, vintage, metadataHash);

      const projectTokens = await token.getProjectTokens(projectId);
      expect(projectTokens).to.have.lengthOf(1);
      expect(projectTokens[0]).to.equal(1);
    });

    it("Should revert with invalid parameters", async function () {
      const { token, issuer } = await loadFixture(deployCarbonCreditTokenFixture);
      
      const projectId = ethers.keccak256(ethers.toUtf8Bytes("PROJECT_001"));
      const mrvId = ethers.keccak256(ethers.toUtf8Bytes("MRV_001"));
      const amount = ethers.parseUnits("100", 0);
      const vintage = 2023;
      const metadataHash = "QmTestMetadata123";

      // Invalid recipient
      await expect(
        token.connect(issuer).mintBatch(ethers.ZeroAddress, projectId, mrvId, amount, vintage, metadataHash)
      ).to.be.revertedWith("Invalid recipient");

      // Zero amount
      await expect(
        token.connect(issuer).mintBatch(issuer.address, projectId, mrvId, 0, vintage, metadataHash)
      ).to.be.revertedWith("Amount must be greater than 0");

      // Invalid vintage (too old)
      await expect(
        token.connect(issuer).mintBatch(issuer.address, projectId, mrvId, amount, 2019, metadataHash)
      ).to.be.revertedWith("Invalid vintage year");

      // Invalid vintage (too future)
      const futureYear = new Date().getFullYear() + 10;
      await expect(
        token.connect(issuer).mintBatch(issuer.address, projectId, mrvId, amount, futureYear, metadataHash)
      ).to.be.revertedWith("Invalid vintage year");

      // Empty metadata hash
      await expect(
        token.connect(issuer).mintBatch(issuer.address, projectId, mrvId, amount, vintage, "")
      ).to.be.revertedWith("Metadata IPFS hash required");
    });

    it("Should revert if called by non-issuer", async function () {
      const { token, user1 } = await loadFixture(deployCarbonCreditTokenFixture);
      
      const projectId = ethers.keccak256(ethers.toUtf8Bytes("PROJECT_001"));
      const mrvId = ethers.keccak256(ethers.toUtf8Bytes("MRV_001"));
      const amount = ethers.parseUnits("100", 0);
      const vintage = 2023;
      const metadataHash = "QmTestMetadata123";

      await expect(
        token.connect(user1).mintBatch(user1.address, projectId, mrvId, amount, vintage, metadataHash)
      ).to.be.revertedWith("AccessControl:");
    });
  });

  describe("Retirement", function () {
    async function mintTokensFixture() {
      const fixture = await loadFixture(deployCarbonCreditTokenFixture);
      const { token, issuer, user1 } = fixture;
      
      const projectId = ethers.keccak256(ethers.toUtf8Bytes("PROJECT_001"));
      const mrvId = ethers.keccak256(ethers.toUtf8Bytes("MRV_001"));
      const amount = ethers.parseUnits("100", 0);
      const vintage = 2023;
      const metadataHash = "QmTestMetadata123";

      await token.connect(issuer).mintBatch(user1.address, projectId, mrvId, amount, vintage, metadataHash);
      
      return { ...fixture, tokenId: 1, mintedAmount: amount };
    }

    it("Should retire credits successfully", async function () {
      const { token, user1, beneficiary, tokenId, mintedAmount } = await loadFixture(mintTokensFixture);
      
      const retireAmount = ethers.parseUnits("50", 0);
      const reason = "Corporate carbon neutrality";

      await expect(
        token.connect(user1).retire(tokenId, retireAmount, beneficiary.address, reason)
      )
        .to.emit(token, "CreditsRetired")
        .withArgs(tokenId, retireAmount, user1.address, beneficiary.address, reason);

      // Check balances
      expect(await token.balanceOf(user1.address, tokenId)).to.equal(mintedAmount - retireAmount);
      expect(await token.getRetiredBalance(beneficiary.address, tokenId)).to.equal(retireAmount);

      // Check batch info
      const batch = await token.getBatchInfo(tokenId);
      expect(batch.totalRetired).to.equal(retireAmount);
    });

    it("Should retire all credits", async function () {
      const { token, user1, beneficiary, tokenId, mintedAmount } = await loadFixture(mintTokensFixture);
      
      const reason = "Full retirement";

      await token.connect(user1).retire(tokenId, mintedAmount, beneficiary.address, reason);

      expect(await token.balanceOf(user1.address, tokenId)).to.equal(0);
      expect(await token.getRetiredBalance(beneficiary.address, tokenId)).to.equal(mintedAmount);
    });

    it("Should handle multiple retirements for same beneficiary", async function () {
      const { token, user1, beneficiary, tokenId } = await loadFixture(mintTokensFixture);
      
      const firstRetirement = ethers.parseUnits("30", 0);
      const secondRetirement = ethers.parseUnits("20", 0);
      const reason = "Multiple retirements";

      await token.connect(user1).retire(tokenId, firstRetirement, beneficiary.address, reason);
      await token.connect(user1).retire(tokenId, secondRetirement, beneficiary.address, reason);

      expect(await token.getRetiredBalance(beneficiary.address, tokenId)).to.equal(firstRetirement + secondRetirement);
    });

    it("Should revert with invalid parameters", async function () {
      const { token, user1, tokenId } = await loadFixture(mintTokensFixture);
      
      const retireAmount = ethers.parseUnits("50", 0);
      const reason = "Test retirement";

      // Invalid beneficiary
      await expect(
        token.connect(user1).retire(tokenId, retireAmount, ethers.ZeroAddress, reason)
      ).to.be.revertedWith("Invalid beneficiary");

      // Zero amount
      await expect(
        token.connect(user1).retire(tokenId, 0, user1.address, reason)
      ).to.be.revertedWith("Amount must be greater than 0");

      // Non-existent token
      await expect(
        token.connect(user1).retire(999, retireAmount, user1.address, reason)
      ).to.be.revertedWith("Token batch does not exist");
    });

    it("Should revert if insufficient balance", async function () {
      const { token, user1, beneficiary, tokenId, mintedAmount } = await loadFixture(mintTokensFixture);
      
      const excessiveAmount = mintedAmount + ethers.parseUnits("1", 0);
      const reason = "Excessive retirement";

      await expect(
        token.connect(user1).retire(tokenId, excessiveAmount, beneficiary.address, reason)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should revert if user doesn't own tokens", async function () {
      const { token, user2, beneficiary, tokenId } = await loadFixture(mintTokensFixture);
      
      const retireAmount = ethers.parseUnits("10", 0);
      const reason = "Unauthorized retirement";

      await expect(
        token.connect(user2).retire(tokenId, retireAmount, beneficiary.address, reason)
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Batch Retirement", function () {
    async function mintMultipleTokensFixture() {
      const fixture = await loadFixture(deployCarbonCreditTokenFixture);
      const { token, issuer, user1 } = fixture;
      
      const projectId = ethers.keccak256(ethers.toUtf8Bytes("PROJECT_001"));
      const amounts = [ethers.parseUnits("100", 0), ethers.parseUnits("200", 0)];
      const tokenIds = [];

      for (let i = 0; i < 2; i++) {
        const mrvId = ethers.keccak256(ethers.toUtf8Bytes(`MRV_00${i + 1}`));
        const vintage = 2023 + i;
        const metadataHash = `QmTestMetadata${i + 1}`;

        await token.connect(issuer).mintBatch(user1.address, projectId, mrvId, amounts[i], vintage, metadataHash);
        tokenIds.push(i + 1);
      }
      
      return { ...fixture, tokenIds, amounts };
    }

    it("Should retire multiple token types successfully", async function () {
      const { token, user1, beneficiary, tokenIds, amounts } = await loadFixture(mintMultipleTokensFixture);
      
      const retireAmounts = [ethers.parseUnits("50", 0), ethers.parseUnits("100", 0)];
      const reason = "Batch retirement";

      await expect(
        token.connect(user1).retireBatch(tokenIds, retireAmounts, beneficiary.address, reason)
      )
        .to.emit(token, "CreditsRetired")
        .withArgs(tokenIds[0], retireAmounts[0], user1.address, beneficiary.address, reason)
        .and.to.emit(token, "CreditsRetired")
        .withArgs(tokenIds[1], retireAmounts[1], user1.address, beneficiary.address, reason);

      // Check balances
      for (let i = 0; i < tokenIds.length; i++) {
        expect(await token.balanceOf(user1.address, tokenIds[i])).to.equal(amounts[i] - retireAmounts[i]);
        expect(await token.getRetiredBalance(beneficiary.address, tokenIds[i])).to.equal(retireAmounts[i]);
      }
    });

    it("Should revert if arrays length mismatch", async function () {
      const { token, user1, beneficiary, tokenIds } = await loadFixture(mintMultipleTokensFixture);
      
      const retireAmounts = [ethers.parseUnits("50", 0)]; // Only one amount for two tokens
      const reason = "Mismatched arrays";

      await expect(
        token.connect(user1).retireBatch(tokenIds, retireAmounts, beneficiary.address, reason)
      ).to.be.revertedWith("Arrays length mismatch");
    });
  });

  describe("Metadata Updates", function () {
    async function mintTokenFixture() {
      const fixture = await loadFixture(deployCarbonCreditTokenFixture);
      const { token, issuer, user1 } = fixture;
      
      const projectId = ethers.keccak256(ethers.toUtf8Bytes("PROJECT_001"));
      const mrvId = ethers.keccak256(ethers.toUtf8Bytes("MRV_001"));
      const amount = ethers.parseUnits("100", 0);
      const vintage = 2023;
      const metadataHash = "QmTestMetadata123";

      await token.connect(issuer).mintBatch(user1.address, projectId, mrvId, amount, vintage, metadataHash);
      
      return { ...fixture, tokenId: 1, originalMetadataHash: metadataHash };
    }

    it("Should update batch metadata successfully", async function () {
      const { token, issuer, tokenId } = await loadFixture(mintTokenFixture);
      
      const newMetadataHash = "QmNewMetadata456";

      await expect(
        token.connect(issuer).updateBatchMetadata(tokenId, newMetadataHash)
      )
        .to.emit(token, "BatchMetadataUpdated")
        .withArgs(tokenId, newMetadataHash);

      const batch = await token.getBatchInfo(tokenId);
      expect(batch.metadataIpfsHash).to.equal(newMetadataHash);
    });

    it("Should revert if token doesn't exist", async function () {
      const { token, issuer } = await loadFixture(deployCarbonCreditTokenFixture);
      
      const newMetadataHash = "QmNewMetadata456";

      await expect(
        token.connect(issuer).updateBatchMetadata(999, newMetadataHash)
      ).to.be.revertedWith("Token batch does not exist");
    });

    it("Should revert if called by non-issuer", async function () {
      const { token, user1, tokenId } = await loadFixture(mintTokenFixture);
      
      const newMetadataHash = "QmNewMetadata456";

      await expect(
        token.connect(user1).updateBatchMetadata(tokenId, newMetadataHash)
      ).to.be.revertedWith("AccessControl:");
    });
  });

  describe("View Functions", function () {
    async function setupMultipleProjectsFixture() {
      const fixture = await loadFixture(deployCarbonCreditTokenFixture);
      const { token, issuer, user1 } = fixture;
      
      const projectIds = [
        ethers.keccak256(ethers.toUtf8Bytes("PROJECT_001")),
        ethers.keccak256(ethers.toUtf8Bytes("PROJECT_002"))
      ];
      
      const tokenIds = [];
      
      // Create tokens for first project
      for (let i = 0; i < 2; i++) {
        const mrvId = ethers.keccak256(ethers.toUtf8Bytes(`MRV_P1_${i + 1}`));
        await token.connect(issuer).mintBatch(
          user1.address, 
          projectIds[0], 
          mrvId, 
          ethers.parseUnits("100", 0), 
          2023, 
          `QmP1Meta${i + 1}`
        );
        tokenIds.push(i + 1);
      }
      
      // Create token for second project
      const mrvId = ethers.keccak256(ethers.toUtf8Bytes("MRV_P2_1"));
      await token.connect(issuer).mintBatch(
        user1.address, 
        projectIds[1], 
        mrvId, 
        ethers.parseUnits("200", 0), 
        2024, 
        "QmP2Meta1"
      );
      tokenIds.push(3);
      
      return { ...fixture, projectIds, tokenIds };
    }

    it("Should return correct project tokens", async function () {
      const { token, projectIds, tokenIds } = await loadFixture(setupMultipleProjectsFixture);
      
      const project1Tokens = await token.getProjectTokens(projectIds[0]);
      const project2Tokens = await token.getProjectTokens(projectIds[1]);
      
      expect(project1Tokens).to.have.lengthOf(2);
      expect(project1Tokens).to.deep.equal([tokenIds[0], tokenIds[1]]);
      
      expect(project2Tokens).to.have.lengthOf(1);
      expect(project2Tokens[0]).to.equal(tokenIds[2]);
    });

    it("Should return empty array for non-existent project", async function () {
      const { token } = await loadFixture(deployCarbonCreditTokenFixture);
      
      const nonExistentProject = ethers.keccak256(ethers.toUtf8Bytes("NONEXISTENT"));
      const projectTokens = await token.getProjectTokens(nonExistentProject);
      
      expect(projectTokens).to.have.lengthOf(0);
    });

    it("Should return correct batch info", async function () {
      const { token, issuer, projectIds } = await loadFixture(setupMultipleProjectsFixture);
      
      const batch = await token.getBatchInfo(1);
      
      expect(batch.projectId).to.equal(projectIds[0]);
      expect(batch.vintage).to.equal(2023);
      expect(batch.totalIssued).to.equal(ethers.parseUnits("100", 0));
      expect(batch.totalRetired).to.equal(0);
      expect(batch.issuer).to.equal(issuer.address);
      expect(batch.exists).to.be.true;
    });
  });

  describe("Access Control", function () {
    it("Should allow admin to grant and revoke issuer role", async function () {
      const { token, admin, user1 } = await loadFixture(deployCarbonCreditTokenFixture);
      
      const ISSUER_ROLE = await token.ISSUER_ROLE();
      
      // Grant role
      await token.connect(admin).grantIssuerRole(user1.address);
      expect(await token.hasRole(ISSUER_ROLE, user1.address)).to.be.true;
      
      // Revoke role
      await token.connect(admin).revokeIssuerRole(user1.address);
      expect(await token.hasRole(ISSUER_ROLE, user1.address)).to.be.false;
    });

    it("Should allow admin to set new URI", async function () {
      const { token, admin } = await loadFixture(deployCarbonCreditTokenFixture);
      
      const newURI = "https://new-gateway.ipfs.io/ipfs/";
      await token.connect(admin).setURI(newURI);
      
      expect(await token.uri(1)).to.equal(newURI);
    });

    it("Should not allow non-admin to set URI", async function () {
      const { token, user1 } = await loadFixture(deployCarbonCreditTokenFixture);
      
      const newURI = "https://malicious.com/";
      
      await expect(
        token.connect(user1).setURI(newURI)
      ).to.be.revertedWith("AccessControl:");
    });
  });

  describe("Pausable", function () {
    it("Should allow pauser to pause and unpause", async function () {
      const { token, admin } = await loadFixture(deployCarbonCreditTokenFixture);
      
      await token.connect(admin).pause();
      expect(await token.paused()).to.be.true;
      
      await token.connect(admin).unpause();
      expect(await token.paused()).to.be.false;
    });

    it("Should prevent minting when paused", async function () {
      const { token, admin, issuer, user1 } = await loadFixture(deployCarbonCreditTokenFixture);
      
      await token.connect(admin).pause();
      
      const projectId = ethers.keccak256(ethers.toUtf8Bytes("PROJECT_001"));
      const mrvId = ethers.keccak256(ethers.toUtf8Bytes("MRV_001"));
      
      await expect(
        token.connect(issuer).mintBatch(user1.address, projectId, mrvId, 100, 2023, "QmHash")
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should prevent retirement when paused", async function () {
      const { token, admin, issuer, user1, beneficiary } = await loadFixture(deployCarbonCreditTokenFixture);
      
      // First mint some tokens
      const projectId = ethers.keccak256(ethers.toUtf8Bytes("PROJECT_001"));
      const mrvId = ethers.keccak256(ethers.toUtf8Bytes("MRV_001"));
      await token.connect(issuer).mintBatch(user1.address, projectId, mrvId, 100, 2023, "QmHash");
      
      // Then pause
      await token.connect(admin).pause();
      
      await expect(
        token.connect(user1).retire(1, 50, beneficiary.address, "Test")
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should prevent transfers when paused", async function () {
      const { token, admin, issuer, user1, user2 } = await loadFixture(deployCarbonCreditTokenFixture);
      
      // First mint some tokens
      const projectId = ethers.keccak256(ethers.toUtf8Bytes("PROJECT_001"));
      const mrvId = ethers.keccak256(ethers.toUtf8Bytes("MRV_001"));
      await token.connect(issuer).mintBatch(user1.address, projectId, mrvId, 100, 2023, "QmHash");
      
      // Then pause
      await token.connect(admin).pause();
      
      await expect(
        token.connect(user1).safeTransferFrom(user1.address, user2.address, 1, 50, "0x")
      ).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("ERC1155 Compliance", function () {
    async function mintForTransferFixture() {
      const fixture = await loadFixture(deployCarbonCreditTokenFixture);
      const { token, issuer, user1 } = fixture;
      
      const projectId = ethers.keccak256(ethers.toUtf8Bytes("PROJECT_001"));
      const mrvId = ethers.keccak256(ethers.toUtf8Bytes("MRV_001"));
      const amount = ethers.parseUnits("100", 0);

      await token.connect(issuer).mintBatch(user1.address, projectId, mrvId, amount, 2023, "QmHash");
      
      return { ...fixture, tokenId: 1, amount };
    }

    it("Should support ERC1155 transfers", async function () {
      const { token, user1, user2, tokenId, amount } = await loadFixture(mintForTransferFixture);
      
      const transferAmount = ethers.parseUnits("30", 0);
      
      await token.connect(user1).safeTransferFrom(user1.address, user2.address, tokenId, transferAmount, "0x");
      
      expect(await token.balanceOf(user1.address, tokenId)).to.equal(amount - transferAmount);
      expect(await token.balanceOf(user2.address, tokenId)).to.equal(transferAmount);
    });

    it("Should support batch transfers", async function () {
      const { token, user1, user2, tokenId, amount } = await loadFixture(mintForTransferFixture);
      
      const transferAmount = ethers.parseUnits("30", 0);
      
      await token.connect(user1).safeBatchTransferFrom(
        user1.address, 
        user2.address, 
        [tokenId], 
        [transferAmount], 
        "0x"
      );
      
      expect(await token.balanceOf(user1.address, tokenId)).to.equal(amount - transferAmount);
      expect(await token.balanceOf(user2.address, tokenId)).to.equal(transferAmount);
    });

    it("Should support approvals", async function () {
      const { token, user1, user2, tokenId } = await loadFixture(mintForTransferFixture);
      
      await token.connect(user1).setApprovalForAll(user2.address, true);
      expect(await token.isApprovedForAll(user1.address, user2.address)).to.be.true;
      
      await token.connect(user1).setApprovalForAll(user2.address, false);
      expect(await token.isApprovedForAll(user1.address, user2.address)).to.be.false;
    });
  });
});
