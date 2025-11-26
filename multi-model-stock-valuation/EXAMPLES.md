# Example Valuations

This document provides real-world test cases demonstrating how the Multi-Model Stock Valuation Tool works with different types of companies.

## Test Case 1: Apple Inc. (AAPL) - Technology Giant

**Company Profile:**
- Sector: Technology
- Industry: Consumer Electronics
- Market Cap: ~$3 Trillion
- Characteristics: High growth, strong cash flow, moderate dividend

**Applicable Models:**
- ✓ DCF (Discounted Cash Flow)
- ✓ P/E Comparables
- ✓ EV/EBITDA
- ✓ PEG Ratio
- ✗ DDM (Low dividend yield)
- ✓ P/B (Asset-light, but applicable)

**Example Results** (as of example date):
```
Current Price: $182.00

Model               Fair Value    Difference    Verdict
----------------------------------------------------------
DCF                 $175.50       -3.6%         Fairly Valued
P/E Comparables     $180.25       -0.9%         Fairly Valued
PEG Ratio           $178.60       -1.9%         Fairly Valued
EV/EBITDA           $184.30       +1.3%         Fairly Valued

Consensus: $179.66  -1.3%         Fairly Valued
Models Used: 4
Confidence: 85%
```

**Key Insights:**
- All models agree stock is fairly valued
- Tight range suggests high confidence
- DCF shows slight undervaluation due to strong FCF
- Tech peers have similar multiples

**Best Models for AAPL:**
1. DCF - Strong, predictable cash flows
2. PEG - Growth balanced with earnings
3. P/E Comparables - Easy comparison with tech peers

---

## Test Case 2: JPMorgan Chase (JPM) - Financial Services

**Company Profile:**
- Sector: Financial Services
- Industry: Banking
- Market Cap: ~$500 Billion
- Characteristics: Asset-heavy, regulated, dividend-paying

**Applicable Models:**
- ✓ P/B (Price-to-Book) ⭐ BEST
- ✓ P/E Comparables
- ✓ DDM (Dividend Discount)
- ✗ DCF (Complex for banks)
- ✗ EV/EBITDA (Not standard for banks)
- ✓ PEG Ratio

**Example Results:**
```
Current Price: $151.00

Model               Fair Value    Difference    Verdict
----------------------------------------------------------
P/B                 $158.30       +4.8%         Undervalued
P/E Comparables     $162.50       +7.6%         Undervalued
DDM                 $155.20       +2.8%         Fairly Valued
PEG Ratio           $160.10       +6.0%         Undervalued

Consensus: $159.03  +5.3%         Undervalued
Models Used: 4
Confidence: 80%
```

**Key Insights:**
- Consistently shows undervaluation
- P/B most reliable for banks (tangible assets)
- DDM suggests modest upside from dividends
- Strong ROE supports higher P/B multiple

**Best Models for JPM:**
1. P/B - Industry standard for banks
2. P/E Comparables - Compare with other big banks
3. DDM - Regular dividend payer

---

## Test Case 3: Johnson & Johnson (JNJ) - Healthcare/Dividend

**Company Profile:**
- Sector: Healthcare
- Industry: Pharmaceuticals & Medical Devices
- Market Cap: ~$400 Billion
- Characteristics: Dividend aristocrat, stable, defensive

**Applicable Models:**
- ✓ DDM (Dividend Discount) ⭐ BEST
- ✓ DCF
- ✓ P/E Comparables
- ✓ EV/EBITDA
- ✓ P/B
- ✓ PEG Ratio

**Example Results:**
```
Current Price: $165.00

Model               Fair Value    Difference    Verdict
----------------------------------------------------------
DDM                 $168.75       +2.3%         Fairly Valued
DCF                 $170.20       +3.2%         Fairly Valued
P/E Comparables     $166.80       +1.1%         Fairly Valued
EV/EBITDA           $164.50       -0.3%         Fairly Valued
PEG Ratio           $167.40       +1.5%         Fairly Valued

Consensus: $167.53  +1.5%         Fairly Valued
Models Used: 5
Confidence: 90%
```

**Key Insights:**
- Very tight range (high confidence)
- All models agree on fair valuation
- DDM appropriate for dividend aristocrat
- Defensive stock with stable metrics

**Best Models for JNJ:**
1. DDM - 60+ years of dividend growth
2. DCF - Predictable healthcare cash flows
3. P/E Comparables - Stable earnings

---

## Test Case 4: Tesla (TSLA) - High Growth

**Company Profile:**
- Sector: Consumer Cyclical
- Industry: Auto Manufacturing
- Market Cap: ~$800 Billion
- Characteristics: High growth, volatile, no dividend

**Applicable Models:**
- ⚠ DCF (High uncertainty)
- ✓ P/E Comparables
- ✓ PEG Ratio ⭐ BEST
- ✗ DDM (No dividend)
- ✓ EV/EBITDA
- ✗ P/B (Asset-light)

**Example Results:**
```
Current Price: $245.00

Model               Fair Value    Difference    Verdict
----------------------------------------------------------
PEG Ratio           $210.30       -14.2%        Overvalued
P/E Comparables     $195.40       -20.2%        Overvalued
DCF                 $180.60       -26.3%        Overvalued
EV/EBITDA           $205.80       -16.0%        Overvalued

Consensus: $198.03  -19.2%        Overvalued
Models Used: 4
Confidence: 60%
```

**Key Insights:**
- Wide valuation range (lower confidence)
- All models suggest overvaluation
- High P/E reflects growth expectations
- DCF very sensitive to assumptions
- Lower confidence due to volatility

**Best Models for TSLA:**
1. PEG Ratio - Accounts for high growth
2. P/E Comparables - With growth adjustment
3. DCF - But very assumption-dependent

---

## Test Case 5: Verizon (VZ) - Utility-Like Telecom

**Company Profile:**
- Sector: Communication Services
- Industry: Telecom
- Market Cap: ~$180 Billion
- Characteristics: High dividend, stable, mature

**Applicable Models:**
- ✓ DDM (Dividend Discount) ⭐ BEST
- ✓ DCF
- ✓ P/E Comparables
- ✓ EV/EBITDA
- ✗ PEG (Low/no growth)
- ✗ P/B (Not asset-focused)

**Example Results:**
```
Current Price: $41.50

Model               Fair Value    Difference    Verdict
----------------------------------------------------------
DDM                 $45.20        +8.9%         Undervalued
DCF                 $43.80        +5.5%         Undervalued
P/E Comparables     $42.60        +2.7%         Fairly Valued
EV/EBITDA           $44.10        +6.3%         Undervalued

Consensus: $43.93   +5.9%         Undervalued
Models Used: 4
Confidence: 85%
```

**Key Insights:**
- DDM shows highest upside (high yield)
- Valued primarily for dividend income
- Mature business with limited growth
- All models suggest modest undervaluation

**Best Models for VZ:**
1. DDM - High, stable dividend yield (~7%)
2. DCF - Predictable cash flows
3. EV/EBITDA - Capital intensive business

---

## Test Case 6: Nvidia (NVDA) - Hyper-Growth Tech

**Company Profile:**
- Sector: Technology
- Industry: Semiconductors
- Market Cap: ~$1 Trillion
- Characteristics: Explosive growth, AI leader, minimal dividend

**Applicable Models:**
- ✓ PEG Ratio ⭐ BEST
- ⚠ DCF (Very high uncertainty)
- ✓ P/E Comparables (with large adjustment)
- ✗ DDM (Minimal dividend)
- ✓ EV/EBITDA
- ✗ P/B (Asset-light)

**Example Results:**
```
Current Price: $495.00

Model               Fair Value    Difference    Verdict
----------------------------------------------------------
PEG Ratio           $420.50       -15.1%        Overvalued
P/E Comparables     $385.20       -22.2%        Overvalued
DCF (Bull Case)     $510.30       +3.1%         Fairly Valued
DCF (Base Case)     $395.80       -20.0%        Overvalued
EV/EBITDA           $405.60       -18.1%        Overvalued

Consensus: $423.48  -14.5%        Overvalued
Models Used: 5
Confidence: 45%
```

**Key Insights:**
- Very wide range reflects uncertainty
- DCF results highly sensitive to growth assumptions
- High P/E justified only with sustained growth
- Low confidence due to volatility

**Best Models for NVDA:**
1. PEG Ratio - Adjusts for exceptional growth
2. DCF with scenarios - Bull/base/bear cases
3. P/E with large growth premium

---

## Key Takeaways

### Model Selection Guide

**Use DCF when:**
- Company has predictable cash flows
- 3+ years of positive FCF history
- Mature or growing business
- Examples: AAPL, JNJ, VZ

**Use DDM when:**
- Stock pays regular dividends
- 5+ years of dividend history
- Dividend growth is sustainable
- Examples: JNJ, VZ, JPM

**Use P/E Comparables when:**
- Positive, stable earnings
- Good peer group exists
- Mature industry
- Examples: All profitable companies

**Use EV/EBITDA when:**
- Capital-intensive business
- Comparing companies with different capital structures
- EBITDA positive even if net income isn't
- Examples: AAPL, VZ, industrials

**Use P/B when:**
- Asset-heavy business
- Financial institutions
- Real estate companies
- Examples: JPM, banks, REITs

**Use PEG when:**
- High growth company
- Positive earnings and growth
- Comparing growth stocks
- Examples: TSLA, NVDA, tech growth

### Interpreting Results

**High Confidence (80-100%):**
- Tight range across models
- Consistent verdict
- High data quality
- Stable business

**Medium Confidence (60-79%):**
- Moderate range
- Most models agree
- Some data limitations
- Growing business

**Low Confidence (< 60%):**
- Wide valuation range
- Models disagree
- Limited or volatile data
- High uncertainty business

### Consensus Approach

**Best Practice:**
1. Run all applicable models
2. Weight by model appropriateness
3. Consider confidence scores
4. Look for agreement vs divergence
5. Investigate outliers
6. Make informed decision

**Verdict Thresholds:**
- Undervalued: Fair value > Current price + 15%
- Fairly Valued: Within ±15%
- Overvalued: Fair value < Current price - 15%

---

## Disclaimer

These examples are for **educational purposes only**. The valuations shown:
- Use hypothetical data and dates
- Are simplified for illustration
- Should NOT be used for actual investment decisions
- Require additional analysis and due diligence

Always:
- Verify data accuracy
- Understand model assumptions
- Consider multiple factors beyond valuation
- Consult financial professionals
- Do your own research

---

*Last Updated: November 2025*
