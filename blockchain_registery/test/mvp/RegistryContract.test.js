const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("RegistryContract", function () {
  async function deployRegistryFixture() {
    const [admin, issuer, auditor, projectOwner, other] = await ethers.getSigners();

    const RegistryContract = await ethers.getContractFactory("RegistryContract");
    const registry = await RegistryContract.deploy(admin.address);

    // Grant roles
    await registry.connect(admin).grantIssuerRole(issuer.address);
    await registry.connect(admin).grantAuditorRole(auditor.address);

    return { registry, admin, issuer, auditor, projectOwner, other };
  }

  describe("Deployment", function () {
    it("Should set the correct admin role", async function () {
      const { registry, admin } = await loadFixture(deployRegistryFixture);
      
      const DEFAULT_ADMIN_ROLE = await registry.DEFAULT_ADMIN_ROLE();
      expect(await registry.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
    });

    it("Should grant issuer and auditor roles correctly", async function () {
      const { registry, issuer, auditor } = await loadFixture(deployRegistryFixture);
      
      const ISSUER_ROLE = await registry.ISSUER_ROLE();
      const AUDITOR_ROLE = await registry.AUDITOR_ROLE();
      
      expect(await registry.hasRole(ISSUER_ROLE, issuer.address)).to.be.true;
      expect(await registry.hasRole(AUDITOR_ROLE, auditor.address)).to.be.true;
    });
  });

  describe("Project Registration", function () {
    it("Should register a project successfully", async function () {
      const { registry, issuer, projectOwner } = await loadFixture(deployRegistryFixture);
      
      const projectId = ethers.keccak256(ethers.toUtf8Bytes("PROJECT_001"));
      const ipfsHash = "QmTestHash123";

      await expect(
        registry.connect(issuer).registerProject(projectId, projectOwner.address, ipfsHash)
      )
        .to.emit(registry, "ProjectRegistered")
        .withArgs(projectId, projectOwner.address, ipfsHash, await ethers.provider.getBlock("latest").then(b => b.timestamp + 1));

      const project = await registry.projects(projectId);
      expect(project.owner).to.equal(projectOwner.address);
      expect(project.ipfsHash).to.equal(ipfsHash);
      expect(project.exists).to.be.true;
    });

    it("Should revert if project already exists", async function () {
      const { registry, issuer, projectOwner } = await loadFixture(deployRegistryFixture);
      
      const projectId = ethers.keccak256(ethers.toUtf8Bytes("PROJECT_001"));
      const ipfsHash = "QmTestHash123";

      await registry.connect(issuer).registerProject(projectId, projectOwner.address, ipfsHash);

      await expect(
        registry.connect(issuer).registerProject(projectId, projectOwner.address, ipfsHash)
      ).to.be.revertedWith("Project already exists");
    });

    it("Should revert if called by non-issuer", async function () {
      const { registry, other, projectOwner } = await loadFixture(deployRegistryFixture);
      
      const projectId = ethers.keccak256(ethers.toUtf8Bytes("PROJECT_001"));
      const ipfsHash = "QmTestHash123";

      await expect(
        registry.connect(other).registerProject(projectId, projectOwner.address, ipfsHash)
      ).to.be.revertedWith("AccessControl:");
    });

    it("Should revert with invalid parameters", async function () {
      const { registry, issuer } = await loadFixture(deployRegistryFixture);
      
      const projectId = ethers.keccak256(ethers.toUtf8Bytes("PROJECT_001"));
      const ipfsHash = "QmTestHash123";

      // Invalid owner address
      await expect(
        registry.connect(issuer).registerProject(projectId, ethers.ZeroAddress, ipfsHash)
      ).to.be.revertedWith("Invalid owner address");

      // Empty IPFS hash
      await expect(
        registry.connect(issuer).registerProject(projectId, issuer.address, "")
      ).to.be.revertedWith("IPFS hash required");
    });
  });

  describe("MRV Anchoring", function () {
    async function setupProject() {
      const fixture = await loadFixture(deployRegistryFixture);
      const { registry, issuer, projectOwner } = fixture;
      
      const projectId = ethers.keccak256(ethers.toUtf8Bytes("PROJECT_001"));
      const ipfsHash = "QmProjectHash123";
      
      await registry.connect(issuer).registerProject(projectId, projectOwner.address, ipfsHash);
      
      return { ...fixture, projectId };
    }

    it("Should anchor MRV successfully", async function () {
      const { registry, issuer, auditor, projectId } = await setupProject();
      
      const mrvId = ethers.keccak256(ethers.toUtf8Bytes("MRV_001"));
      const ipfsHash = "QmMRVHash123";
      const tCO2e = ethers.parseUnits("100", 0); // 100 tCO2e

      await expect(
        registry.connect(issuer).anchorMRV(mrvId, projectId, ipfsHash, tCO2e, auditor.address)
      )
        .to.emit(registry, "MRVAnchored")
        .withArgs(mrvId, projectId, ipfsHash, tCO2e, auditor.address, await ethers.provider.getBlock("latest").then(b => b.timestamp + 1));

      const mrvRecord = await registry.mrvRecords(mrvId);
      expect(mrvRecord.projectId).to.equal(projectId);
      expect(mrvRecord.ipfsHash).to.equal(ipfsHash);
      expect(mrvRecord.tCO2e).to.equal(tCO2e);
      expect(mrvRecord.auditor).to.equal(auditor.address);
      expect(mrvRecord.exists).to.be.true;
    });

    it("Should add MRV to project's MRV list", async function () {
      const { registry, issuer, auditor, projectId } = await setupProject();
      
      const mrvId = ethers.keccak256(ethers.toUtf8Bytes("MRV_001"));
      const ipfsHash = "QmMRVHash123";
      const tCO2e = ethers.parseUnits("100", 0);

      await registry.connect(issuer).anchorMRV(mrvId, projectId, ipfsHash, tCO2e, auditor.address);

      const projectMRVs = await registry.getProjectMRVs(projectId);
      expect(projectMRVs).to.have.lengthOf(1);
      expect(projectMRVs[0]).to.equal(mrvId);
    });

    it("Should revert if MRV already exists", async function () {
      const { registry, issuer, auditor, projectId } = await setupProject();
      
      const mrvId = ethers.keccak256(ethers.toUtf8Bytes("MRV_001"));
      const ipfsHash = "QmMRVHash123";
      const tCO2e = ethers.parseUnits("100", 0);

      await registry.connect(issuer).anchorMRV(mrvId, projectId, ipfsHash, tCO2e, auditor.address);

      await expect(
        registry.connect(issuer).anchorMRV(mrvId, projectId, ipfsHash, tCO2e, auditor.address)
      ).to.be.revertedWith("MRV already anchored");
    });

    it("Should revert if project doesn't exist", async function () {
      const { registry, issuer, auditor } = await loadFixture(deployRegistryFixture);
      
      const nonExistentProjectId = ethers.keccak256(ethers.toUtf8Bytes("NONEXISTENT"));
      const mrvId = ethers.keccak256(ethers.toUtf8Bytes("MRV_001"));
      const ipfsHash = "QmMRVHash123";
      const tCO2e = ethers.parseUnits("100", 0);

      await expect(
        registry.connect(issuer).anchorMRV(mrvId, nonExistentProjectId, ipfsHash, tCO2e, auditor.address)
      ).to.be.revertedWith("Project not registered");
    });

    it("Should revert with invalid parameters", async function () {
      const { registry, issuer, auditor, projectId } = await setupProject();
      
      const mrvId = ethers.keccak256(ethers.toUtf8Bytes("MRV_001"));
      const ipfsHash = "QmMRVHash123";
      const tCO2e = ethers.parseUnits("100", 0);

      // Empty IPFS hash
      await expect(
        registry.connect(issuer).anchorMRV(mrvId, projectId, "", tCO2e, auditor.address)
      ).to.be.revertedWith("IPFS hash required");

      // Zero tCO2e
      await expect(
        registry.connect(issuer).anchorMRV(mrvId, projectId, ipfsHash, 0, auditor.address)
      ).to.be.revertedWith("tCO2e must be greater than 0");

      // Invalid auditor address
      await expect(
        registry.connect(issuer).anchorMRV(mrvId, projectId, ipfsHash, tCO2e, ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid auditor address");
    });
  });

  describe("MRV Updates", function () {
    async function setupMRV() {
      const fixture = await setupProject();
      const { registry, issuer, auditor, projectId } = fixture;
      
      const mrvId = ethers.keccak256(ethers.toUtf8Bytes("MRV_001"));
      const ipfsHash = "QmMRVHash123";
      const tCO2e = ethers.parseUnits("100", 0);
      
      await registry.connect(issuer).anchorMRV(mrvId, projectId, ipfsHash, tCO2e, auditor.address);
      
      return { ...fixture, mrvId, originalIpfsHash: ipfsHash };
    }

    async function setupProject() {
      const fixture = await loadFixture(deployRegistryFixture);
      const { registry, issuer, projectOwner } = fixture;
      
      const projectId = ethers.keccak256(ethers.toUtf8Bytes("PROJECT_001"));
      const ipfsHash = "QmProjectHash123";
      
      await registry.connect(issuer).registerProject(projectId, projectOwner.address, ipfsHash);
      
      return { ...fixture, projectId };
    }

    it("Should update MRV hash successfully", async function () {
      const { registry, issuer, mrvId } = await setupMRV();
      
      const newIpfsHash = "QmNewMRVHash456";

      await expect(
        registry.connect(issuer).updateMRVHash(mrvId, newIpfsHash)
      )
        .to.emit(registry, "MRVUpdated")
        .withArgs(mrvId, newIpfsHash, await ethers.provider.getBlock("latest").then(b => b.timestamp + 1));

      const mrvRecord = await registry.mrvRecords(mrvId);
      expect(mrvRecord.ipfsHash).to.equal(newIpfsHash);
    });

    it("Should revert if MRV doesn't exist", async function () {
      const { registry, issuer } = await loadFixture(deployRegistryFixture);
      
      const nonExistentMrvId = ethers.keccak256(ethers.toUtf8Bytes("NONEXISTENT"));
      const newIpfsHash = "QmNewMRVHash456";

      await expect(
        registry.connect(issuer).updateMRVHash(nonExistentMrvId, newIpfsHash)
      ).to.be.revertedWith("MRV not found");
    });
  });

  describe("View Functions", function () {
    async function setupMultipleMRVs() {
      const fixture = await loadFixture(deployRegistryFixture);
      const { registry, issuer, auditor, projectOwner } = fixture;
      
      const projectId = ethers.keccak256(ethers.toUtf8Bytes("PROJECT_001"));
      await registry.connect(issuer).registerProject(projectId, projectOwner.address, "QmProjectHash");
      
      const mrvIds = [];
      for (let i = 1; i <= 3; i++) {
        const mrvId = ethers.keccak256(ethers.toUtf8Bytes(`MRV_00${i}`));
        await registry.connect(issuer).anchorMRV(
          mrvId, 
          projectId, 
          `QmMRVHash${i}`, 
          ethers.parseUnits((i * 50).toString(), 0), 
          auditor.address
        );
        mrvIds.push(mrvId);
      }
      
      return { ...fixture, projectId, mrvIds };
    }

    it("Should return project MRVs correctly", async function () {
      const { registry, projectId, mrvIds } = await setupMultipleMRVs();
      
      const projectMRVs = await registry.getProjectMRVs(projectId);
      expect(projectMRVs).to.have.lengthOf(3);
      expect(projectMRVs).to.deep.equal(mrvIds);
    });

    it("Should return MRV info correctly", async function () {
      const { registry, projectId, mrvIds, auditor } = await setupMultipleMRVs();
      
      const [exists, returnedProjectId, tCO2e, returnedAuditor] = await registry.getMRVInfo(mrvIds[0]);
      
      expect(exists).to.be.true;
      expect(returnedProjectId).to.equal(projectId);
      expect(tCO2e).to.equal(ethers.parseUnits("50", 0));
      expect(returnedAuditor).to.equal(auditor.address);
    });

    it("Should return false for non-existent MRV", async function () {
      const { registry } = await loadFixture(deployRegistryFixture);
      
      const nonExistentMrvId = ethers.keccak256(ethers.toUtf8Bytes("NONEXISTENT"));
      const [exists] = await registry.getMRVInfo(nonExistentMrvId);
      
      expect(exists).to.be.false;
    });
  });

  describe("Access Control", function () {
    it("Should allow admin to grant and revoke roles", async function () {
      const { registry, admin, other } = await loadFixture(deployRegistryFixture);
      
      const ISSUER_ROLE = await registry.ISSUER_ROLE();
      
      // Grant role
      await registry.connect(admin).grantIssuerRole(other.address);
      expect(await registry.hasRole(ISSUER_ROLE, other.address)).to.be.true;
      
      // Revoke role
      await registry.connect(admin).revokeIssuerRole(other.address);
      expect(await registry.hasRole(ISSUER_ROLE, other.address)).to.be.false;
    });

    it("Should not allow non-admin to grant roles", async function () {
      const { registry, other, issuer } = await loadFixture(deployRegistryFixture);
      
      await expect(
        registry.connect(other).grantIssuerRole(issuer.address)
      ).to.be.revertedWith("AccessControl:");
    });
  });

  describe("Pausable", function () {
    it("Should allow pauser to pause and unpause", async function () {
      const { registry, admin } = await loadFixture(deployRegistryFixture);
      
      await registry.connect(admin).pause();
      expect(await registry.paused()).to.be.true;
      
      await registry.connect(admin).unpause();
      expect(await registry.paused()).to.be.false;
    });

    it("Should prevent operations when paused", async function () {
      const { registry, admin, issuer, projectOwner } = await loadFixture(deployRegistryFixture);
      
      await registry.connect(admin).pause();
      
      const projectId = ethers.keccak256(ethers.toUtf8Bytes("PROJECT_001"));
      
      await expect(
        registry.connect(issuer).registerProject(projectId, projectOwner.address, "QmHash")
      ).to.be.revertedWith("Pausable: paused");
    });
  });
});
