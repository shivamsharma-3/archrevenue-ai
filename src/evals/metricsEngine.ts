import fs from 'fs';
import path from 'path';

interface MetricState {
  factAccuracy: number;
  eventAccuracy: number;
  precision: number;
  recall: number;
  f1: number;
}

export function runMetrics(results: any[]) {
  let truePositiveFacts = 0;
  let falsePositiveFacts = 0;
  let falseNegativeFacts = 0;

  let truePositiveEvents = 0;
  let falsePositiveEvents = 0;
  let falseNegativeEvents = 0;

  const failureLog: string[] = [];
  const rootCauses = {
    Prompt: 0,
    Parser: 0,
    DiffEngine: 0,
    Normalization: 0,
    Dataset: 0,
  };

  for (const result of results) {
    const rawOut = result.rawOutput || {};
    
    // ─── Fact Metrics ───
    const expectedFactKeys = result.expectedFacts.map((f: any) => `${f.category}:${String(f.value).toLowerCase()}`);
    const actualFactKeys = result.actualFacts.map((f: any) => `${f.category}:${String(f.value).toLowerCase()}`);

    for (const af of result.actualFacts) {
      const key = `${af.category}:${String(af.value).toLowerCase()}`;
      if (expectedFactKeys.includes(key)) {
        truePositiveFacts++;
      } else {
        falsePositiveFacts++;
        failureLog.push(`FALSE POSITIVE (Fact) | Domain: ${result.domain}`);
        failureLog.push(`Expected: NOT ${af.category}=${af.value}`);
        failureLog.push(`Actual: ${af.category}=${af.value}`);
        
        // Root cause guess
        if (rawOut?.facts && String(rawOut.facts[af.category.toLowerCase()]) === String(af.value)) {
          failureLog.push(`Root Cause: Prompt (Hallucinated fact)`);
          failureLog.push(`Prompt Output: ${JSON.stringify(rawOut.facts)}`);
          rootCauses.Prompt++;
        } else {
          failureLog.push(`Root Cause: Parser (Mapped incorrectly)`);
          rootCauses.Parser++;
        }
        failureLog.push('--------------------------------');
      }
    }

    for (const ef of result.expectedFacts) {
      const key = `${ef.category}:${String(ef.value).toLowerCase()}`;
      if (!actualFactKeys.includes(key)) {
        falseNegativeFacts++;
        failureLog.push(`FALSE NEGATIVE (Fact) | Domain: ${result.domain}`);
        failureLog.push(`Expected: ${ef.category}=${ef.value}`);
        
        const actualVal = result.actualFacts.find((f: any) => f.category === ef.category)?.value || 'Unknown';
        failureLog.push(`Actual: ${actualVal}`);

        // Try to find if LLM returned it but case/format didn't match
        const rawField = ef.category.toLowerCase();
        let rawVal = null;
        if (rawOut?.facts && rawOut.facts[rawField] !== undefined) rawVal = rawOut.facts[rawField];
        else if (rawOut[rawField] !== undefined) rawVal = rawOut[rawField];

        if (rawVal === undefined || rawVal === 'Unknown' || rawVal === 0 || rawVal === '') {
          failureLog.push(`Root Cause: Prompt (LLM failed to extract)`);
          failureLog.push(`Evidence (raw JSON): ${JSON.stringify(rawOut.facts || rawOut)}`);
          rootCauses.Prompt++;
        } else if (String(rawVal).toLowerCase() !== String(ef.value).toLowerCase()) {
          failureLog.push(`Root Cause: Prompt (Extracted wrong value: ${rawVal})`);
          rootCauses.Prompt++;
        } else {
          failureLog.push(`Root Cause: Parser/Normalization (LLM extracted ${rawVal} but parser missed it)`);
          rootCauses.Parser++;
        }
        failureLog.push('--------------------------------');
      }
    }

    // ─── Event Metrics ───
    const expectedEventKeys = result.expectedEvents.map((e: any) => e.type);
    const actualEventKeys = result.actualEvents.map((e: any) => e.type);

    for (const ae of result.actualEvents) {
      if (expectedEventKeys.includes(ae.type)) {
        truePositiveEvents++;
      } else {
        falsePositiveEvents++;
        failureLog.push(`FALSE POSITIVE (Event) | Domain: ${result.domain}`);
        failureLog.push(`Expected: No ${ae.type}`);
        failureLog.push(`Actual: ${ae.type}`);
        failureLog.push(`Root Cause: DiffEngine (Emitted spurious event)`);
        rootCauses.DiffEngine++;
        failureLog.push('--------------------------------');
      }
    }

    for (const ee of result.expectedEvents) {
      if (!actualEventKeys.includes(ee.type)) {
        falseNegativeEvents++;
        failureLog.push(`FALSE NEGATIVE (Event) | Domain: ${result.domain}`);
        failureLog.push(`Expected: ${ee.type}`);
        failureLog.push(`Actual: No event`);
        failureLog.push(`Root Cause: DiffEngine (Ignored valid delta or Fact missing)`);
        rootCauses.DiffEngine++;
        failureLog.push('--------------------------------');
      }
    }
  }

  // Fact calculations
  const totalExpectedFacts = truePositiveFacts + falseNegativeFacts;
  const factAccuracy = totalExpectedFacts > 0 ? (truePositiveFacts / totalExpectedFacts) * 100 : 0;

  // Event calculations
  const totalExpectedEvents = truePositiveEvents + falseNegativeEvents;
  const eventAccuracy = totalExpectedEvents > 0 ? (truePositiveEvents / totalExpectedEvents) * 100 : 0;

  const precision = (truePositiveEvents + falsePositiveEvents) > 0 
    ? (truePositiveEvents / (truePositiveEvents + falsePositiveEvents)) * 100 : 0;
  const recall = (truePositiveEvents + falseNegativeEvents) > 0
    ? (truePositiveEvents / (truePositiveEvents + falseNegativeEvents)) * 100 : 0;
  const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  // Load previous metrics for deltas
  const metricsFile = path.join(process.cwd(), 'src/evals/last_metrics.json');
  let prev: MetricState | null = null;
  if (fs.existsSync(metricsFile)) {
    prev = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
  }

  const formatDelta = (current: number, previous?: number) => {
    if (previous === undefined) return '';
    const diff = current - previous;
    if (diff > 0) return `(↑ +${diff.toFixed(1)}%)`;
    if (diff < 0) return `(↓ ${diff.toFixed(1)}%)`;
    return '(-)';
  };

  console.log('\n=========================================');
  console.log('       FAILURE ANALYSIS REPORT');
  console.log('=========================================');
  
  failureLog.forEach(l => console.log(l));

  console.log('=========================================');
  console.log('       EVALUATION METRICS');
  console.log('=========================================');
  console.log(`Fact Accuracy:        ${factAccuracy.toFixed(1)}% ${formatDelta(factAccuracy, prev?.factAccuracy)}`);
  console.log(`Event Accuracy:       ${eventAccuracy.toFixed(1)}% ${formatDelta(eventAccuracy, prev?.eventAccuracy)}`);
  console.log(`Precision:            ${precision.toFixed(1)}% ${formatDelta(precision, prev?.precision)}`);
  console.log(`Recall:               ${recall.toFixed(1)}% ${formatDelta(recall, prev?.recall)}`);
  console.log(`F1 Score:             ${f1.toFixed(1)}% ${formatDelta(f1, prev?.f1)}`);
  console.log('-----------------------------------------');
  console.log(`False Positives:      ${falsePositiveEvents} (Events), ${falsePositiveFacts} (Facts)`);
  console.log(`False Negatives:      ${falseNegativeEvents} (Events), ${falseNegativeFacts} (Facts)`);
  console.log('=========================================');
  console.log('       ROOT CAUSE BREAKDOWN');
  console.log('=========================================');
  console.log(`Prompt:               ${rootCauses.Prompt} failures`);
  console.log(`Parser:               ${rootCauses.Parser} failures`);
  console.log(`Diff Engine:          ${rootCauses.DiffEngine} failures`);
  console.log(`Normalization:        ${rootCauses.Normalization} failures`);
  console.log(`Dataset:              ${rootCauses.Dataset} failures`);
  console.log('=========================================\n');

  // Save current state
  fs.writeFileSync(metricsFile, JSON.stringify({ factAccuracy, eventAccuracy, precision, recall, f1 }, null, 2));

  // Regression Gate Check
  if (factAccuracy < 90 || eventAccuracy < 90 || precision < 90 || recall < 90 || f1 < 90) {
    console.error('Regression: FAIL (Threshold < 90%)');
    process.exit(1);
  } else {
    console.log('Regression: PASS');
  }
}
