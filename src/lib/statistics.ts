/**
 * Statistical analysis utilities for A/B test experiments.
 * Handles sample size calculations, z-tests for proportions,
 * and confidence interval computation.
 */

/**
 * Standard normal CDF approximation (Abramowitz and Stegun).
 * Used for computing p-values from z-scores.
 */
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y =
    1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Inverse normal CDF approximation (rational approximation).
 * Used for sample size calculations given a desired confidence level.
 */
function normalInverseCDF(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;

  // Rational approximation for central region
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.383577518672690e2, -3.066479806614716e1, 2.506628277459239e0,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q: number, r: number;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (
      ((((((-7.784894002430293e-3 * q - 3.223964580411365e-1) * q -
        2.400758277161838) *
        q -
        2.549732539343734) *
        q +
        4.374664141464968) *
        q +
        2.938163982698783)) /
      ((((7.784695709041462e-3 * q + 3.224671290700398e-1) * q +
        2.445134137142996) *
        q +
        3.754408661907416) *
        q +
        1)
    );
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) *
        q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    );
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(
      ((((((-7.784894002430293e-3 * q - 3.223964580411365e-1) * q -
        2.400758277161838) *
        q -
        2.549732539343734) *
        q +
        4.374664141464968) *
        q +
        2.938163982698783)) /
      ((((7.784695709041462e-3 * q + 3.224671290700398e-1) * q +
        2.445134137142996) *
        q +
        3.754408661907416) *
        q +
        1)
    );
  }
}

/**
 * Calculate required sample size per variant for a two-proportion z-test.
 *
 * @param baselineRate - Current conversion/open rate (e.g., 0.22 for 22%)
 * @param minimumDetectableLift - Relative lift to detect (e.g., 0.10 for 10%)
 * @param significance - Significance level (default 0.05 for 95% confidence)
 * @param power - Statistical power (default 0.80)
 * @returns Required sample size per variant
 */
export function calculateSampleSize(
  baselineRate: number,
  minimumDetectableLift: number,
  significance: number = 0.05,
  power: number = 0.80
): number {
  const p1 = baselineRate;
  const p2 = baselineRate * (1 + minimumDetectableLift);

  const zAlpha = normalInverseCDF(1 - significance / 2);
  const zBeta = normalInverseCDF(power);

  const pBar = (p1 + p2) / 2;

  const numerator =
    (zAlpha * Math.sqrt(2 * pBar * (1 - pBar)) +
      zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2;
  const denominator = (p2 - p1) ** 2;

  return Math.ceil(numerator / denominator);
}

export interface SignificanceResult {
  /** Z-score of the test */
  zScore: number;
  /** Two-tailed p-value */
  pValue: number;
  /** Whether the result is statistically significant at the given level */
  isSignificant: boolean;
  /** Relative lift of variant over control */
  relativeLift: number;
  /** 95% confidence interval for the difference in proportions */
  confidenceInterval: [number, number];
  /** Confidence level (1 - pValue) as a percentage */
  confidence: number;
}

/**
 * Two-proportion z-test comparing a variant against a control.
 *
 * @param controlSampleSize - Number of observations in the control group
 * @param controlSuccesses - Number of successes (opens, clicks, etc.) in control
 * @param variantSampleSize - Number of observations in the variant group
 * @param variantSuccesses - Number of successes in the variant group
 * @param significance - Significance threshold (default 0.05)
 * @returns Statistical test results
 */
export function twoProportionZTest(
  controlSampleSize: number,
  controlSuccesses: number,
  variantSampleSize: number,
  variantSuccesses: number,
  significance: number = 0.05
): SignificanceResult {
  const p1 = controlSuccesses / controlSampleSize;
  const p2 = variantSuccesses / variantSampleSize;

  // Pooled proportion under H0
  const pPooled =
    (controlSuccesses + variantSuccesses) /
    (controlSampleSize + variantSampleSize);

  // Standard error
  const se = Math.sqrt(
    pPooled * (1 - pPooled) * (1 / controlSampleSize + 1 / variantSampleSize)
  );

  const zScore = se === 0 ? 0 : (p2 - p1) / se;
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));

  // Confidence interval for the difference (p2 - p1)
  const seDiff = Math.sqrt(
    (p1 * (1 - p1)) / controlSampleSize +
      (p2 * (1 - p2)) / variantSampleSize
  );
  const zCrit = normalInverseCDF(1 - significance / 2);
  const diff = p2 - p1;

  return {
    zScore,
    pValue,
    isSignificant: pValue < significance,
    relativeLift: p1 === 0 ? 0 : (p2 - p1) / p1,
    confidenceInterval: [diff - zCrit * seDiff, diff + zCrit * seDiff],
    confidence: (1 - pValue) * 100,
  };
}
