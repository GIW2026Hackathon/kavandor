import { describe, expect, it } from 'vitest';
import { ValueAdditionEngine } from '@/lib/value-addition-engine';

describe('ValueAdditionEngine', () => {
  describe('Tomato Pathway Triage', () => {
    it('ranks cold storage highly for firm breaker tomatoes with medium-large volume', () => {
      const evaluation = ValueAdditionEngine.evaluatePathways({
        crop: 'Tomatoes',
        quantity: 220,
        unit: 'kg',
        location: 'Nyakundi Farm · Kisii',
        handlingNotes: 'Harvested at dawn; firm breaker maturity stage; sorted into crates',
      });

      expect(evaluation.pathways.length).toBeGreaterThanOrEqual(3);

      const coldStorage = evaluation.pathways.find((p) => p.type === 'storage');
      expect(coldStorage).toBeDefined();
      expect(coldStorage!.suitabilityScore).toBeGreaterThanOrEqual(85);
      expect(coldStorage!.suitabilityTier).toBe('highly_recommended');
      expect(coldStorage!.breakEvenTargetPriceKES).toBeDefined();
      expect(coldStorage!.breakEvenTargetPriceKES).toBeGreaterThan(45);
    });

    it('heavily penalizes cold storage and prioritizes puree processing for overripe tomatoes', () => {
      const evaluation = ValueAdditionEngine.evaluatePathways({
        crop: 'Tomatoes',
        quantity: 350,
        unit: 'kg',
        location: 'Nyakoe · Kisii',
        handlingNotes: 'Ripe and soft fruit; harvested 2 days ago; cannot withstand transport',
      });

      const coldStorage = evaluation.pathways.find((p) => p.type === 'storage');
      const processing = evaluation.pathways.find((p) => p.type === 'processing');

      expect(coldStorage).toBeDefined();
      expect(processing).toBeDefined();

      // Cold storage must be penalized for overripe fruit (chilling injury / rot risk)
      expect(coldStorage!.suitabilityScore).toBeLessThanOrEqual(40);

      // Processing must rank ahead of storage
      expect(processing!.suitabilityScore).toBeGreaterThan(coldStorage!.suitabilityScore!);
      expect(processing!.yieldRetentionPercent).toBe(45); // 45% puree recovery
      expect(processing!.outputQuantity).toBe(157.5); // 350 * 0.45
      expect(processing!.outputUnit).toBe('kg puree pouches');
      expect(processing!.matchedProvider?.name).toContain('Nyakoe Agro-Processing');
    });

    it('penalizes cold storage when quantity is too small for commercial holding tariffs', () => {
      const evaluation = ValueAdditionEngine.evaluatePathways({
        crop: 'Tomatoes',
        quantity: 30, // small quantity
        unit: 'kg',
        location: 'Suneka · Kisii',
        handlingNotes: 'Firm breaker tomatoes',
      });

      const coldStorage = evaluation.pathways.find((p) => p.type === 'storage');
      expect(coldStorage).toBeDefined();
      // Storage score penalized due to qty < 50 kg
      expect(coldStorage!.suitabilityScore).toBeLessThan(80);
    });
  });

  describe('Dairy Value-Addition Pathways', () => {
    it('proposes rapid 4°C bulk chilling with lactometer testing for cow milk', () => {
      const evaluation = ValueAdditionEngine.evaluatePathways({
        crop: 'Cow milk',
        quantity: 60,
        unit: 'litre',
        location: 'Nyamira Town',
        handlingNotes: 'Morning milking at 06:30 AM in clean stainless aluminium cans',
      });

      const dairyPathway = evaluation.pathways.find((p) => p.type === 'dairy_chilling');
      expect(dairyPathway).toBeDefined();
      expect(dairyPathway!.suitabilityTier).toBe('highly_recommended');
      expect(dairyPathway!.suitabilityScore).toBeGreaterThanOrEqual(90);
      expect(dairyPathway!.matchedProvider?.name).toContain('Nyamira Dairy Farmers Co-op');
      expect(dairyPathway!.assumptions.some((a) => a.includes('4°C'))).toBe(true);
      expect(dairyPathway!.unknowns.some((u) => u.toLowerCase().includes('lactometer'))).toBe(true);

      // Dairy must not propose solar drying or standard produce cold storage
      expect(evaluation.pathways.some((p) => p.type === 'drying')).toBe(false);
      expect(evaluation.pathways.some((p) => p.type === 'storage')).toBe(false);
    });
  });

  describe('Avocado Cold-Press Oil Extraction', () => {
    it('evaluates extra virgin cold-press extraction with 11% oil yield', () => {
      const evaluation = ValueAdditionEngine.evaluatePathways({
        crop: 'Avocados',
        quantity: 500,
        unit: 'kg',
        location: 'Kisii Rural',
        handlingNotes: 'Mature Hass avocados ready for pressing',
      });

      const oilPathway = evaluation.pathways.find(
        (p) => p.type === 'processing' && p.title.includes('Avocado')
      );
      expect(oilPathway).toBeDefined();
      expect(oilPathway!.yieldRetentionPercent).toBe(11);
      expect(oilPathway!.outputQuantity).toBe(55); // 500 * 0.11
      expect(oilPathway!.outputUnit).toBe('litres virgin oil');
      expect(oilPathway!.grossRevenueKES).toBe(55 * 650);
    });
  });

  describe('Clarification Loop & Re-Ranking', () => {
    it('generates targeted clarification questions when handling details are ambiguous', () => {
      const evaluation = ValueAdditionEngine.evaluatePathways({
        crop: 'Tomatoes',
        quantity: 200,
        unit: 'kg',
        location: 'Kisii',
        // handlingNotes omitted intentionally
      });

      expect(evaluation.clarificationQuestions.length).toBeGreaterThanOrEqual(2);
      const ripenessQ = evaluation.clarificationQuestions.find((q) => q.id === 'ripeness_stage');
      expect(ripenessQ).toBeDefined();
      expect(ripenessQ!.options).toContain('Breaker / Turning (firm)');
      expect(ripenessQ!.options).toContain('Overripe / Soft (immediate processing only)');
    });

    it('re-ranks pathways when clarification answers indicate overripe fruit', () => {
      // First: unclarified
      const baseEval = ValueAdditionEngine.evaluatePathways({
        crop: 'Tomatoes',
        quantity: 200,
        unit: 'kg',
        location: 'Kisii',
      });

      // Second: answered as overripe
      const answeredEval = ValueAdditionEngine.evaluatePathways(
        {
          crop: 'Tomatoes',
          quantity: 200,
          unit: 'kg',
          location: 'Kisii',
        },
        {
          ripeness_stage: 'Overripe / Soft (immediate processing only)',
          delivery_window: 'Immediate (within 12 hours)',
        }
      );

      const baseStorage = baseEval.pathways.find((p) => p.type === 'storage');
      const answeredStorage = answeredEval.pathways.find((p) => p.type === 'storage');
      const answeredProcessing = answeredEval.pathways.find((p) => p.type === 'processing');

      expect(answeredStorage!.suitabilityScore).toBeLessThan(baseStorage!.suitabilityScore!);
      expect(answeredProcessing!.suitabilityScore).toBeGreaterThan(answeredStorage!.suitabilityScore!);
    });
  });

  describe('Evidence Taxonomy Structure', () => {
    it('produces all five distinct evidence tiers', () => {
      const evaluation = ValueAdditionEngine.evaluatePathways({
        crop: 'Tomatoes',
        quantity: 220,
        unit: 'kg',
        location: 'Nyakundi Farm · Kisii',
        handlingNotes: 'Harvested at dawn into ventilated crates',
      });

      const { evidence } = evaluation;
      expect(evidence.visualObservations).toBeInstanceOf(Array);
      expect(evidence.farmerReportedFacts).toBeInstanceOf(Array);
      expect(evidence.verifiedProviderInfo).toBeInstanceOf(Array);
      expect(evidence.estimates).toBeInstanceOf(Array);
      expect(evidence.unknowns).toBeInstanceOf(Array);

      expect(evidence.farmerReportedFacts.some((f) => f.includes('220 kg'))).toBe(true);
      expect(evidence.unknowns.some((u) => u.toLowerCase().includes('tare') || u.toLowerCase().includes('intake'))).toBe(true);
    });
  });
});
