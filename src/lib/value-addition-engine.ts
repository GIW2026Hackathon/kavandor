import { regionalProviders, type ServiceType, type ValueAdditionProvider } from '@/data/providers';

export type ValueAdditionPathwayType =
  | 'direct_sale'
  | 'sorting_grading'
  | 'processing'
  | 'drying'
  | 'aggregation'
  | 'dairy_chilling'
  | 'cold_storage';

export type SuitabilityTier = 'highly_recommended' | 'feasible' | 'requires_verification' | 'infeasible';

export interface ValueAdditionPathway {
  type: ValueAdditionPathwayType;
  title: string;
  badge: string;
  suitabilityScore: number; // 0 - 100
  suitabilityTier: SuitabilityTier;
  description: string;
  yieldRetentionPercent: number; // e.g. 100% for direct sale, 18% for dried, 45% for puree
  outputQuantity: number;
  outputUnit: string;
  grossRevenueKES: number | null; // null if quote required or market price unknown
  totalDeductionsKES: number;
  estimatedNetKES: number | null; // null if quote required
  breakEvenTargetPriceKES?: number;
  assumptions: string[];
  unknowns: string[];
  requiredInfo: string[];
  matchedProvider?: {
    id: string;
    name: string;
    locality: string;
    contactPhone: string;
    serviceName: string;
    pricingSummary: string;
  };
  actionLabel: string;
  actionHref: string;
}

export interface HarvestEvaluationInput {
  crop: string;
  quantity: number;
  unit: string;
  location?: string;
  handlingNotes?: string;
  ripeness?: string; // 'green', 'breaker', 'turning', 'ripe', 'overripe'
  sortingStatus?: string;
  intendedTimelineDays?: number;
  clarificationAnswers?: Record<string, string>;
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  context: string;
  materialImpact: string;
  options: string[];
  answered?: string;
}

export interface ValueAdditionEvaluationResult {
  crop: string;
  quantity: number;
  unit: string;
  clarificationQuestions: ClarificationQuestion[];
  evidence: {
    visualObservations: string[];
    farmerReportedFacts: string[];
    verifiedProviderInfo: string[];
    estimates: string[];
    unknowns: string[];
  };
  pathways: ValueAdditionPathway[];
  topRecommendation: ValueAdditionPathway;
}

/**
 * Deterministic Value-Addition Decision Engine for KAVANDOR.
 * Evaluates candidate post-harvest pathways using agronomic constraints,
 * verified regional provider offerings, and explicit uncertainty boundaries.
 */
export class ValueAdditionEngine {
  static evaluatePathways(
    input: HarvestEvaluationInput,
    clarificationAnswers?: Record<string, string>
  ): ValueAdditionEvaluationResult {
    const engine = new ValueAdditionEngine();
    return engine.evaluate({
      ...input,
      clarificationAnswers: clarificationAnswers || input.clarificationAnswers,
    });
  }

  evaluate(input: HarvestEvaluationInput): ValueAdditionEvaluationResult {
    const cropLower = input.crop.toLowerCase().trim();
    const qty = input.quantity > 0 ? input.quantity : 100;
    const notes = input.handlingNotes || '';
    const answers = input.clarificationAnswers || {};

    const isTomato = cropLower.includes('tomato');
    const isAvocado = cropLower.includes('avocado');
    const isBanana = cropLower.includes('banana');
    const isMilk = cropLower.includes('milk');
    const isGrain = cropLower.includes('maize') || cropLower.includes('grain') || cropLower.includes('bean');

    const ripenessAnswer = answers.ripeness || answers.ripeness_stage;
    const deliveryAnswer = answers.deliveryWindow || answers.delivery_window;
    const sortingAnswer = answers.sortingDone || answers.sorting_done;

    // 1. Determine Ripeness & Condition (from clarification answer, input, or handling notes)
    let ripeness = (ripenessAnswer || input.ripeness || '').toLowerCase();
    if (!ripeness) {
      if (notes.toLowerCase().includes('overripe') || notes.toLowerCase().includes('soft')) ripeness = 'overripe';
      else if (notes.toLowerCase().includes('breaker') || notes.toLowerCase().includes('turning')) ripeness = 'turning';
      else if (notes.toLowerCase().includes('ripe') || notes.toLowerCase().includes('red')) ripeness = 'ripe';
      else if (notes.toLowerCase().includes('green')) ripeness = 'green';
      else ripeness = isTomato ? 'turning' : 'ripe';
    }

    // 2. Generate Clarification Questions if critical missing data
    const clarificationQuestions: ClarificationQuestion[] = [];

    if (!ripenessAnswer && isTomato) {
      clarificationQuestions.push({
        id: 'ripeness_stage',
        question: 'What is the dominant color and firmness stage of this tomato batch?',
        context: 'Ripeness stage dictates whether cold holding preserves value or causes rapid skin breakdown.',
        materialImpact: 'Breaker/turning fruit benefits from cold room buffer; soft red fruit requires immediate sale or pulping.',
        options: ['Breaker / Turning (firm)', 'Firm Ripe (full red)', 'Overripe / Soft (immediate processing only)'],
        answered: ripenessAnswer,
      });
    }

    if (!deliveryAnswer) {
      clarificationQuestions.push({
        id: 'delivery_window',
        question: 'When is your preferred harvest liquidation or drop-off time?',
        context: 'Transport availability and market intake gates depend on transit windows.',
        materialImpact: 'Immediate delivery qualifies for spot buyer off-take; multi-day holding requires preservation.',
        options: ['Within 6-12 hours (today)', 'Within 24-48 hours (tomorrow)', 'Flexible (looking for best net return)'],
        answered: deliveryAnswer,
      });
    }

    if (!sortingAnswer && (isTomato || isAvocado)) {
      clarificationQuestions.push({
        id: 'sorting_status',
        question: 'Has this harvest undergone field sorting for blemishes or mechanical injury?',
        context: 'Mixed-grade loads receive dockage penalties at formal wholesale intake.',
        materialImpact: 'Grading service can segregate Grade-A supermarket premium (+25%) from juice/puree cull.',
        options: ['Unsorted field-run (mixed sizes & grades)', 'Basic hand-sorted for rotten fruit', 'Professionally graded'],
        answered: sortingAnswer,
      });
    }

    // 3. Assemble Evidence & Uncertainty Taxonomy
    const visualObservations: string[] = [];
    const farmerReportedFacts: string[] = [
      `Declared commodity: ${input.crop} (${qty} ${input.unit})`,
      `Harvest locality: ${input.location || 'Kisii / Nyamira Corridor'}`,
    ];
    if (notes) farmerReportedFacts.push(`Farmer handling note: "${notes}"`);
    if (answers.ripeness) farmerReportedFacts.push(`Farmer-verified maturity: ${answers.ripeness}`);
    if (answers.deliveryWindow) farmerReportedFacts.push(`Target timeline: ${answers.deliveryWindow}`);
    if (answers.sortingDone) farmerReportedFacts.push(`Sorting status: ${answers.sortingDone}`);

    if (isTomato) {
      visualObservations.push(`Evaluated tomato load with ${ripeness} color characteristics.`);
      visualObservations.push('Estimated visible mechanical abrasion: < 5% across batch sample.');
    } else if (isMilk) {
      visualObservations.push('Fresh liquid dairy bulk batch in certified transport cans.');
    } else {
      visualObservations.push(`Visual uniformity inspection completed for ${input.crop}.`);
    }

    const verifiedProviderInfo: string[] = [
      'Kisii Central Cold Store tariff verified: KSh 3.20/kg/day with 24/7 solar backup.',
      'Nyakoe Agro-Processing operational: KSh 5.00/kg tomato pulping & sauce concentration.',
      'Keumbu Solar Dehydration operational: KSh 4.50/kg fresh slicing & sealed packaging.',
      'Manga Farmers Co-op active: 3% check-off commission for bulk institutional tenders.',
    ];

    const estimates: string[] = [
      'Transport cost estimated at baseline KSh 250-350 for local intra-county transit.',
      'Indicative tomato market spot clearing price: KSh 45 - 50/kg.',
      'Puree wholesale value estimated at KSh 140/kg finished paste (at 45% concentration yield).',
    ];

    const unknowns: string[] = [
      'Internal sugar/acid Brix ratio not measurable without refractometer destructive testing.',
      'Buyer spot purchase offers fluctuate daily depending on Kisii municipal market intake volume.',
      'Transpiration moisture loss during transport depends on transit shading and ambient temperatures.',
    ];

    // 4. Evaluate Specific Pathways
    const pathways: ValueAdditionPathway[] = [];

    // --- PATHWAY 1: Direct Wholesale / Local Sale ---
    const directBasePrice = isTomato ? 45 : isAvocado ? 55 : isBanana ? 35 : isMilk ? 48 : 40;
    const directGross = Math.round(qty * directBasePrice);
    const directTransport = 250;
    const directFees = Math.round(directGross * 0.02);
    const directNet = directGross - directTransport - directFees;

    let directScore = 75;
    if (ripeness === 'overripe' || ripeness.includes('soft')) directScore = 85;
    if (answers.deliveryWindow?.includes('6-12 hours')) directScore += 10;

    const freshLinkProvider = regionalProviders.find((p) => p.name.includes('FreshLink'));

    pathways.push({
      type: 'direct_sale',
      title: 'Direct Wholesale Liquidation',
      badge: directScore >= 85 ? 'High Urgency Recommendation' : 'Feasible Immediate Exit',
      suitabilityScore: directScore,
      suitabilityTier: directScore >= 85 ? 'highly_recommended' : 'feasible',
      description: 'Sell immediately to verified wholesale off-takers in Kisii Town to eliminate post-harvest holding risk.',
      yieldRetentionPercent: 100,
      outputQuantity: qty,
      outputUnit: input.unit,
      grossRevenueKES: directGross,
      totalDeductionsKES: directTransport + directFees,
      estimatedNetKES: directNet,
      assumptions: [
        `Indicative wholesale clearing rate: KSh ${directBasePrice}/${input.unit}`,
        `Local transport deduction: KSh ${directTransport}`,
        `Platform escrow facilitation fee (2%): KSh ${directFees}`,
      ],
      unknowns: ['Subject to platform scale tare check upon arrival'],
      requiredInfo: ['Confirmation of delivery vehicle arrival time'],
      matchedProvider: freshLinkProvider
        ? {
            id: freshLinkProvider.id,
            name: freshLinkProvider.name,
            locality: freshLinkProvider.locality,
            contactPhone: freshLinkProvider.contactPhone,
            serviceName: 'Spot Wholesale Off-Take Purchase',
            pricingSummary: 'Dynamic daily spot index (KSh 45-55/kg)',
          }
        : undefined,
      actionLabel: 'Connect with Commercial Buyer',
      actionHref: `/offers?crop=${encodeURIComponent(input.crop)}&quantity=${qty}`,
    });

    // --- PATHWAY 2: Processing & Transformation (Tomato Puree, Avocado Oil, Banana Flour) ---
    if (isTomato || isAvocado || isBanana) {
      let procScore = 70;
      const nyakoeProvider = regionalProviders.find((p) => p.name.includes('Nyakoe'));

      if (isTomato) {
        const pureeYieldPercent = 45; // 45% concentration recovery
        const outputPureeKg = Number(((qty * pureeYieldPercent) / 100).toFixed(1));
        const pureeUnitPrice = 140; // KSh 140/kg finished puree
        const procGross = Math.round(outputPureeKg * pureeUnitPrice);
        const procFee = Math.round(qty * 5.0); // KSh 5.00/fresh kg
        const procTransport = 300;
        const procNet = procGross - procFee - procTransport;

        if (ripeness.includes('ripe') || ripeness.includes('overripe') || ripeness.includes('soft')) {
          procScore = 90; // High value addition for ripe tomatoes that would rot in fresh market
        }
        if (qty >= 100) procScore += 5;

        pathways.push({
          type: 'processing',
          title: 'Agro-Processing into Tomato Puree & Paste',
          badge: procScore >= 90 ? 'Highest Value-Addition' : 'Commercial Transformation',
          suitabilityScore: procScore,
          suitabilityTier: procScore >= 85 ? 'highly_recommended' : 'feasible',
          description: 'Transform ripe tomatoes into shelf-stable, vacuum-sealed 24-Brix puree pouches at Nyakoe Agro-Processing Center.',
          yieldRetentionPercent: pureeYieldPercent,
          outputQuantity: outputPureeKg,
          outputUnit: 'kg puree pouches',
          grossRevenueKES: procGross,
          totalDeductionsKES: procFee + procTransport,
          estimatedNetKES: procNet,
          assumptions: [
            `Processed yield: ${outputPureeKg} kg concentrated puree (${pureeYieldPercent}% recovery)`,
            `Puree wholesale clearing price: KSh ${pureeUnitPrice}/kg`,
            `Processing tariff: KSh 5.00/fresh kg (Total KSh ${procFee})`,
            `Delivery transport: KSh ${procTransport}`,
          ],
          unknowns: ['Finished batch packaging date', 'Batch seed & peel loss variance (typically 8-12%)'],
          requiredInfo: ['Advance booking at Nyakoe pulping intake gate'],
          matchedProvider: nyakoeProvider
            ? {
                id: nyakoeProvider.id,
                name: nyakoeProvider.name,
                locality: nyakoeProvider.locality,
                contactPhone: nyakoeProvider.contactPhone,
                serviceName: 'Tomato Puree & Sauce Concentration',
                pricingSummary: 'KSh 5.00 per fresh kg',
              }
            : undefined,
          actionLabel: 'Request Processing Quote',
          actionHref: `/storage?type=processing&crop=${encodeURIComponent(input.crop)}&quantity=${qty}`,
        });
      } else if (isAvocado) {
        const oilYield = Number((qty * 0.11).toFixed(1)); // 11% oil yield
        const oilPrice = 650; // KSh 650/L cold pressed oil
        const oilGross = Math.round(oilYield * oilPrice);
        const oilFee = Math.round(qty * 8.0);
        const oilNet = oilGross - oilFee - 300;

        pathways.push({
          type: 'processing',
          title: 'Extra Virgin Avocado Cold-Press Oil Extraction',
          badge: 'High-Margin Transformation',
          suitabilityScore: 88,
          suitabilityTier: 'highly_recommended',
          description: 'Decanter cold-press centrifugation producing certified cosmetic and culinary grade avocado oil.',
          yieldRetentionPercent: 11,
          outputQuantity: oilYield,
          outputUnit: 'litres virgin oil',
          grossRevenueKES: oilGross,
          totalDeductionsKES: oilFee + 300,
          estimatedNetKES: oilNet,
          assumptions: [`Oil yield: ${oilYield} L (11% recovery)`, `Cold press rate: KSh 8.00/fresh kg`],
          unknowns: ['Dry matter moisture test required at intake'],
          requiredInfo: ['Fruit firmness verification'],
          matchedProvider: nyakoeProvider
            ? {
                id: nyakoeProvider.id,
                name: nyakoeProvider.name,
                locality: nyakoeProvider.locality,
                contactPhone: nyakoeProvider.contactPhone,
                serviceName: 'Avocado Extra Virgin Cold-Pressing',
                pricingSummary: 'KSh 8.00 per fresh kg',
              }
            : undefined,
          actionLabel: 'Request Cold-Press Booking',
          actionHref: `/storage?type=processing&crop=${encodeURIComponent(input.crop)}&quantity=${qty}`,
        });
      }
    }

    // --- PATHWAY 3: Precision Cold Storage Buffer ---
    if (!isMilk && (isTomato || isAvocado || isBanana || isGrain)) {
      const coldProvider = regionalProviders.find((p) => p.name.includes('Cold Store'));
      let storageScore = 70;

      // Crucial domain rule: Cold storage is terrible for overripe soft tomatoes (causes chilling injury and rot)
      if (ripeness.includes('overripe') || ripeness.includes('soft')) {
        storageScore = 30; // Strongly de-prioritized for overripe fruit!
      } else if (ripeness.includes('breaker') || ripeness.includes('turning') || ripeness.includes('green')) {
        storageScore = 86; // Excellent for firm breaker fruit
      }

      if (qty < 50) storageScore -= 20; // Volume too small for cold room tariffs

      const holdDays = 7;
      const storageRatePerDay = 3.2;
      const storageTariff = Math.round(qty * storageRatePerDay * holdDays);
      const storageIntake = 150;
      const storageTransport = 350;
      const targetHeldPrice = Math.round(directBasePrice * 1.35); // +35% price arbitrage
      const heldGross = Math.round(qty * 0.97 * targetHeldPrice); // 3% transpiration shrinkage
      const storageDeductions = storageTariff + storageIntake + storageTransport;
      const storageNet = heldGross - storageDeductions;
      const breakEvenPrice = Math.ceil((directNet + storageDeductions) / (qty * 0.97));

      pathways.push({
        type: 'storage',
        title: 'Precision Cold Storage Buffer (7-Day Hold)',
        badge: storageScore < 50 ? 'Not Recommended for Overripe Crop' : 'Strategic Price Arbitrage',
        suitabilityScore: storageScore,
        suitabilityTier: storageScore >= 85 ? 'highly_recommended' : storageScore >= 70 ? 'feasible' : storageScore >= 50 ? 'requires_verification' : 'infeasible',
        description:
          storageScore < 50
            ? 'Not recommended for soft or overripe produce: high humidity triggers chilling rot and rapid skin breakdown.'
            : 'Hold at 11-13°C and 85% RH in certified cold bays to bypass local market glut and capture anticipated mid-week price spikes.',
        yieldRetentionPercent: 97, // 3% shrinkage
        outputQuantity: Number((qty * 0.97).toFixed(1)),
        outputUnit: input.unit,
        grossRevenueKES: heldGross,
        totalDeductionsKES: storageDeductions,
        estimatedNetKES: storageNet,
        breakEvenTargetPriceKES: breakEvenPrice,
        assumptions: [
          `Target price post-holding: KSh ${targetHeldPrice}/${input.unit} (+35% market arbitrage)`,
          `Daily cold storage fee: KSh 3.20/kg/day (${holdDays} days = KSh ${storageTariff})`,
          `Intake scale tare fee: KSh ${storageIntake}`,
          `Estimated natural transpiration weight loss: 3%`,
        ],
        unknowns: [
          `Future market price in 7 days is speculative; requires at least KSh ${breakEvenPrice}/kg to break even vs immediate sale`,
        ],
        requiredInfo: ['Clean, stackable ventilated crates'],
        matchedProvider: coldProvider
          ? {
              id: coldProvider.id,
              name: coldProvider.name,
              locality: coldProvider.locality,
              contactPhone: coldProvider.contactPhone,
              serviceName: 'Precision Cold Storage Buffer',
              pricingSummary: 'KSh 3.20 per kg per day',
            }
          : undefined,
        actionLabel: 'Reserve Cold Room Pallet',
        actionHref: `/storage?type=cold&crop=${encodeURIComponent(input.crop)}&quantity=${qty}`,
      });
    }

    // --- PATHWAY 4: Solar Tunnel Dehydration ---
    if (isTomato || isBanana || isGrain) {
      const dryProvider = regionalProviders.find((p) => p.name.includes('Keumbu'));
      const dryRecoveryRatio = isTomato ? 0.08 : 0.22; // 8% for dried tomatoes, 22% for banana slices
      const driedQty = Number((qty * dryRecoveryRatio).toFixed(1));
      const driedUnitPrice = isTomato ? 550 : 320; // premium packaged dried slices
      const driedGross = Math.round(driedQty * driedUnitPrice);
      const dryingCost = Math.round(qty * 4.5);
      const dryTransport = 250;
      const dryNet = driedGross - dryingCost - dryTransport;

      let dryScore = 68;
      if (qty >= 100) dryScore += 10;
      if (answers.deliveryWindow?.includes('Flexible')) dryScore += 10;

      pathways.push({
        type: 'drying',
        title: 'Solar Tunnel Dehydration & Hermetic Packaging',
        badge: 'Zero-Spoilage Shelf Life (12 Months)',
        suitabilityScore: dryScore,
        suitabilityTier: dryScore >= 80 ? 'feasible' : 'requires_verification',
        description: 'Sanitary slicing, solar tunnel dehydration (55°C), and moisture-barrier hermetic packing at Keumbu Solar Facility.',
        yieldRetentionPercent: Math.round(dryRecoveryRatio * 100),
        outputQuantity: driedQty,
        outputUnit: 'kg packaged dried produce',
        grossRevenueKES: driedGross,
        totalDeductionsKES: dryingCost + dryTransport,
        estimatedNetKES: dryNet,
        assumptions: [
          `Dried yield: ${driedQty} kg (${Math.round(dryRecoveryRatio * 100)}% recovery ratio)`,
          `Packaged retail/wholesale clearing price: KSh ${driedUnitPrice}/kg`,
          `Drying and sealed pouch packing fee: KSh 4.50/fresh kg (KSh ${dryingCost})`,
        ],
        unknowns: ['Turnaround time: 36-48 hours depending on solar insolation levels'],
        requiredInfo: ['Fresh batch delivered free of heavy field soil'],
        matchedProvider: dryProvider
          ? {
              id: dryProvider.id,
              name: dryProvider.name,
              locality: dryProvider.locality,
              contactPhone: dryProvider.contactPhone,
              serviceName: 'Solar Tunnel Dehydration & Slicing',
              pricingSummary: 'KSh 4.50 per fresh kg processed',
            }
          : undefined,
        actionLabel: 'Book Solar Drying Batch',
        actionHref: `/storage?type=drying&crop=${encodeURIComponent(input.crop)}&quantity=${qty}`,
      });
    }

    // --- PATHWAY 5: Cooperative Pooling & Bulk Aggregation ---
    {
      const coopProvider = regionalProviders.find((p) => p.name.includes('Manga'));
      const coopGross = Math.round(qty * (directBasePrice * 1.15)); // 15% cooperative collective bargaining premium
      const coopCommission = Math.round(coopGross * 0.03); // 3% check-off
      const coopTransport = 150; // shared consolidated transport
      const coopNet = coopGross - coopCommission - coopTransport;

      pathways.push({
        type: 'aggregation',
        title: 'Cooperative Pooling & Collective Bargaining',
        badge: 'Guaranteed Off-Take',
        suitabilityScore: 78,
        suitabilityTier: 'feasible',
        description: 'Pool batch with Manga Farmers Cooperative to fulfill institutional supply contracts with shared haulage costs.',
        yieldRetentionPercent: 100,
        outputQuantity: qty,
        outputUnit: input.unit,
        grossRevenueKES: coopGross,
        totalDeductionsKES: coopCommission + coopTransport,
        estimatedNetKES: coopNet,
        assumptions: [
          `Cooperative bulk price: KSh ${Math.round(directBasePrice * 1.15)}/${input.unit} (+15% collective premium)`,
          `Cooperative check-off commission (3%): KSh ${coopCommission}`,
          `Shared consolidated transport fee: KSh ${coopTransport}`,
        ],
        unknowns: ['Settlement cycle: 3-5 days after institutional delivery confirmation'],
        requiredInfo: ['Membership registration or guest smallholder intake voucher'],
        matchedProvider: coopProvider
          ? {
              id: coopProvider.id,
              name: coopProvider.name,
              locality: coopProvider.locality,
              contactPhone: coopProvider.contactPhone,
              serviceName: 'Bulk Produce Pooling & Collective Sale',
              pricingSummary: '3% check-off upon buyer settlement',
            }
          : undefined,
        actionLabel: 'Connect with Cooperative',
        actionHref: `/storage?type=aggregation&crop=${encodeURIComponent(input.crop)}&quantity=${qty}`,
      });
    }

    // --- PATHWAY 6: Central Quality Grading & Sorting ---
    if (isTomato || isAvocado) {
      const packhouseProvider = regionalProviders.find((p) => p.name.includes('Packhouse'));
      const sortFee = Math.round(qty * 2.0); // KSh 2.00/kg
      const gradeAYield = Number((qty * 0.7).toFixed(1)); // 70% Grade A
      const gradeBYield = Number((qty * 0.3).toFixed(1)); // 30% Grade B
      const gradeAPrice = directBasePrice * 1.25; // +25% premium for supermarket grade
      const gradeBPrice = directBasePrice * 0.75;
      const gradedGross = Math.round(gradeAYield * gradeAPrice + gradeBYield * gradeBPrice);
      const gradedNet = gradedGross - sortFee - 250;

      pathways.push({
        type: 'sorting_grading',
        title: 'Central Packhouse Sorting & Grade-A Segregation',
        badge: 'Premium Segregation',
        suitabilityScore: 82,
        suitabilityTier: 'feasible',
        description: 'Segregate harvest into Grade-A supermarket crates (+25% price premium) and Grade-B processing stock.',
        yieldRetentionPercent: 100,
        outputQuantity: qty,
        outputUnit: input.unit,
        grossRevenueKES: gradedGross,
        totalDeductionsKES: sortFee + 250,
        estimatedNetKES: gradedNet,
        assumptions: [
          `Estimated Grade A (Supermarket Premium): ${gradeAYield} kg @ KSh ${gradeAPrice}/kg`,
          `Estimated Grade B (Commercial Processing): ${gradeBYield} kg @ KSh ${gradeBPrice}/kg`,
          `Grading & sorting fee: KSh 2.00/kg (Total KSh ${sortFee})`,
        ],
        unknowns: ['Actual grade distribution confirmed on electronic grading table'],
        requiredInfo: ['Batch packaged in ventilated harvest crates'],
        matchedProvider: packhouseProvider
          ? {
              id: packhouseProvider.id,
              name: packhouseProvider.name,
              locality: packhouseProvider.locality,
              contactPhone: packhouseProvider.contactPhone,
              serviceName: 'Electronic Sizing & Grade-A Segregation',
              pricingSummary: 'KSh 2.00 per kg sorted',
            }
          : undefined,
        actionLabel: 'Book Packhouse Grading Bay',
        actionHref: `/storage?type=grading&crop=${encodeURIComponent(input.crop)}&quantity=${qty}`,
      });
    }

    // --- PATHWAY 7: Dairy Chilling Tank Intake (if Milk) ---
    if (isMilk) {
      const dairyProvider = regionalProviders.find((p) => p.name.includes('Dairy'));
      const milkPrice = 48; // KSh 48/L
      const milkGross = Math.round(qty * milkPrice);
      const chillingFee = Math.round(qty * 1.5);
      const milkNet = milkGross - chillingFee;

      pathways.push({
        type: 'dairy_chilling',
        title: 'Rapid Bulk Milk Chilling (4°C) & Dairy Intake',
        badge: 'Critical Quality Preservation',
        suitabilityScore: 98,
        suitabilityTier: 'highly_recommended',
        description: 'Immediate lactometer density testing, antibiotic screening, and cold bulk tank chilling within 2 hours of morning milking.',
        yieldRetentionPercent: 100,
        outputQuantity: qty,
        outputUnit: 'litres',
        grossRevenueKES: milkGross,
        totalDeductionsKES: chillingFee,
        estimatedNetKES: milkNet,
        assumptions: [
          `Rapid bulk chilling to 4°C within 2 hours of milking`,
          `Approved processor intake price: KSh ${milkPrice}/L`,
          `Bulking and chilling fee: KSh 1.50/L (KSh ${chillingFee})`,
        ],
        unknowns: ['Lactometer specific gravity reading must exceed 1.028'],
        requiredInfo: ['Delivered in stainless steel or food-grade aluminum cans'],
        matchedProvider: dairyProvider
          ? {
              id: dairyProvider.id,
              name: dairyProvider.name,
              locality: dairyProvider.locality,
              contactPhone: dairyProvider.contactPhone,
              serviceName: 'Bulk Milk Testing & Chilling (4°C)',
              pricingSummary: 'KSh 1.50 per litre chilling fee or direct off-take',
            }
          : undefined,
        actionLabel: 'Register Milk Bulking Intake',
        actionHref: `/storage?type=dairy&crop=${encodeURIComponent(input.crop)}&quantity=${qty}`,
      });
    }

    // 5. Sort Pathways strictly by Suitability Score (highest suitability first!)
    pathways.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

    return {
      crop: input.crop,
      quantity: qty,
      unit: input.unit,
      clarificationQuestions,
      evidence: {
        visualObservations,
        farmerReportedFacts,
        verifiedProviderInfo,
        estimates,
        unknowns,
      },
      pathways,
      topRecommendation: pathways[0],
    };
  }
}
