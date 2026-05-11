/**
 * SmartContract.js
 * ─────────────────────────────────────────────────────────────
 * Simulates smart contract behaviour for DataTrust-SC.
 *
 * Each dataset gets its own PolicyContract instance at upload
 * time. Once deployed, the policy is LOCKED — it cannot be
 * changed without creating a new contract (mimicking real
 * on-chain immutability).
 *
 * Core concepts replicated from real smart contracts:
 *   - Immutable state after deployment
 *   - Self-executing rule evaluation (execute())
 *   - Structured event emission per execution
 *   - Execution history kept per contract instance
 */

const crypto = require("crypto");

class PolicyContract {
  /**
   * @param {string} policy  - ABAC policy string, e.g. "role:CityAuthority OR role:Researcher AND attribute:sensitivity=private"
   * @param {string} owner   - The role of the data owner who "deployed" this contract
   * @param {string} dataHash - SHA-256 hash of the dataset this contract governs
   */
  constructor(policy, owner, dataHash) {
    if (!policy || !owner || !dataHash) {
      throw new Error("PolicyContract: policy, owner, and dataHash are required to deploy.");
    }

    // ── Immutable contract identity ──────────────────────────
    this.contractId = crypto
      .createHash("sha256")
      .update(policy + owner + dataHash + Date.now())
      .digest("hex");

    this.deployedAt  = new Date().toISOString();
    this.owner       = owner;
    this.dataHash    = dataHash;

    // Policy is frozen after construction — Object.freeze prevents mutation
    this._policy = Object.freeze({ raw: policy });

    // ── Execution history (in-memory audit trail) ────────────
    this._executions = [];
  }

  // ── Read-only accessors ────────────────────────────────────
  get policy()      { return this._policy.raw; }
  get executions()  { return [...this._executions]; }   // copy, not reference

  // ── Core contract function ─────────────────────────────────
  /**
   * execute() — The "smart contract call".
   *
   * Evaluates the ABAC policy against the requester's role and
   * attribute. Returns a structured ContractEvent and appends
   * it to the local execution history.
   *
   * @param {string} role      - Requester's role (e.g. "Researcher")
   * @param {string} attribute - Requester's attribute (e.g. "sensitivity=private")
   * @returns {{ granted: boolean, contractId: string, executedAt: string, role: string, attribute: string, policy: string }}
   */
  execute(role, attribute) {
    if (!role || !attribute) {
      throw new Error("PolicyContract.execute(): role and attribute are required.");
    }

    const granted = this._evaluatePolicy(role, attribute);

    const event = {
      contractId:  this.contractId,
      dataHash:    this.dataHash,
      policy:      this._policy.raw,
      role,
      attribute,
      granted,
      executedAt:  new Date().toISOString()
    };

    this._executions.push(event);
    return event;
  }

  // ── Internal ABAC evaluator (moved from utils/policy.js) ──
  /**
   * Supports:
   *   role:CityAuthority
   *   role:Researcher AND attribute:sensitivity=private
   *   role:CityAuthority OR role:Citizen AND attribute:sensitivity=public
   */
  _evaluatePolicy(role, attribute) {
    const policy = this._policy.raw;
    if (!policy) return false;

    // Split by OR
    const orClauses = policy.split(/\s+OR\s+/i).map(c => c.trim());

    for (const clause of orClauses) {
      const andParts = clause.split(/\s+AND\s+/i).map(p => p.trim());
      let allMet = true;

      for (const part of andParts) {
        if (part.startsWith("role:")) {
          if (role !== part.replace("role:", "").trim()) { allMet = false; break; }
        } else if (part.startsWith("attribute:")) {
          if (attribute !== part.replace("attribute:", "").trim()) { allMet = false; break; }
        }
      }

      if (allMet) return true;
    }

    return false;
  }

  // ── Helper: serialise for logging / storage ───────────────
  toJSON() {
    return {
      contractId:  this.contractId,
      deployedAt:  this.deployedAt,
      owner:       this.owner,
      dataHash:    this.dataHash,
      policy:      this._policy.raw,
      executionCount: this._executions.length
    };
  }
}

module.exports = PolicyContract;