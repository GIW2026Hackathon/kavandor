# KAVANDOR — Component Registry & Inventory

## 1. Global & Common Components

| Component | Path | Description & Props |
| :--- | :--- | :--- |
| **`KavandorLogo`** | `src/components/common/KavandorLogo.tsx` | Bespoke geometric SVG mark + wordmark. Props: `variant?: 'dark' \| 'light' \| 'mono'`, `size?: number`. |
| **`RoleSwitcher`** | `src/components/common/RoleSwitcher.tsx` | Floating / top bar demo role switcher. Lets judges switch between Farmer, Facility, Transporter, Buyer, Ops, with Demo Reset button. |
| **`Navbar`** | `src/components/common/Navbar.tsx` | Role-aware navigation bar with current workspace links and notification indicator. |
| **`Footer`** | `src/components/common/Footer.tsx` | Editorial footer with system status, EAT time clock, and brand manifesto. |

---

## 2. Interactive Workflow & Visualization

| Component | Path | Description & Props |
| :--- | :--- | :--- |
| **`LiveWorkflowVisualizer`** | `src/components/landing/LiveWorkflowVisualizer.tsx` | Step-by-step interactive simulator on landing page showing harvest moving through 8 supply states with live data updates. |
| **`StatusBadge`** | `src/components/ui/StatusBadge.tsx` | Semantic tag for domain statuses (Submitted, Confirmed, In Transit, Stored, Discrepancy). |
| **`TimelineTracker`** | `src/components/ui/TimelineTracker.tsx` | Visual vertical/horizontal milestone stepper for harvest and transport jobs. |
| **`CapacityGauge`** | `src/components/facility/CapacityGauge.tsx` | Tri-color segmented bar: Available (Green/Clean), Reserved (Amber), Occupied (Orange/Charcoal). |

---

## 3. Role-Specific Component Inventory

### Farmer Components
- `CropPhotoUploader`: File dropzone and camera capture with instant thumbnail preview and simulated scanner overlay.
- `CropAssessmentCard`: Displays AI vision output (crop, condition, urgency, limitations, recommendation).
- `FacilityOptionCard`: Comparison card showing distance, daily storage fee, transport fee, and suitability score.
- `BatchOfferCard`: Displays received buyer offers with accept/reject/counter buttons.

### Transporter Components
- `HaulageJobCard`: Summary of cargo, pickup village, destination cold hub, load weight, and fee in KES.
- `MilestoneActionStepper`: Big tap button triggering next delivery state with verification prompt.

### Facility Components
- `IntakeCheckInModal`: Weigh-in dialog with requested vs weighed kg, grading picker, and discrepancy detection.
- `BatchDetailDrawer`: Detailed batch inspection, storage duration, temperature log, and release authorization.

### Buyer Components
- `MarketplaceBatchCard`: Verified cold-chain card with produce photos, location, verified kg, price/kg, and direct offer trigger.
- `MultiBatchCombinator`: Interactive tool allowing buyers to aggregate multiple smallholder batches to reach wholesale targets.

### Operations & Intelligence Components
- `OpsMetricCard`: Real-time stat tile with sparkline or delta indicator.
- `WorkflowTraceInspector`: Deep-dive inspector displaying task-by-task agent execution, input/output JSON, and timestamps.
- `ExceptionRemediationModal`: One-click resolution interface for operational exceptions (retry, reassign, override, escalate).
- `AuditLogTable`: Searchable, filterable chronological log of all human, agent, and system events.
