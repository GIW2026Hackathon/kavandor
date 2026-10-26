---
name: kavandor-agentic
description: Agentic orchestration rules, tool contracts, state invariants, and exception remediation protocols for the KAVANDOR Intelligent Harvest & Supply Network.
---

# KAVANDOR Agentic Skill

This skill defines the operational protocols, permission boundaries, and state transitions for KAVANDOR's 13 autonomous and deterministic agents coordinating post-harvest logistics in Kenya (Kisii & Nyamira counties).

## Core Directives

1. **Deterministic Authority Over Capacity & Money:**
   - LLMs and vision models must never commit capacity reservations or release funds directly.
   - All state mutations must pass through typed services (`StorageService.reserveCapacity()`, `TransactionService.verifyEscrow()`).

2. **Multimodal Crop Assessment Protocol:**
   - Server-side route: `/api/ai/assess`
   - Accepts image payload and produces structured Zod-validated output: `cropName`, `conditionGrade`, `visibleDefects`, `urgencyLevel`, `recommendedAction`.
   - If AI credentials are not set, immediately and transparently fallback to deterministic fixtures without blocking the user.

3. **Exception Remediation:**
   - Detect failures proactively (e.g. transport milestone SLA breach, weight discrepancy at packhouse scale).
   - Route through `/ops/exceptions` with one-click safe remediation actions (`reassignTransporter`, `adjustBatchWeight`, `overrideCapacity`).
