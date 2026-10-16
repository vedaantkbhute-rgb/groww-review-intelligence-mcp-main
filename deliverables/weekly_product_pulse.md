# Weekly Product Pulse: Groww Mutual Funds Sentiment & Fee Friction
**Target Product:** Groww (Mutual Funds Distribution)  
**Timeframe:** Last 8–12 Weeks (2026-08-01 to 2026-10-10)  
**Sample Volume:** 25 Verified Customer Reviews  
**Audience:** Internal Product & Engineering Teams  
**Status:** Approved by Product Lead  

---

## 1. Executive Summary & Top Themes
Analysis of recent customer feedback indicates that **Pricing & Unexpected Exit Load Charges (40.0%)** is the primary driver of 1-star and 2-star reviews. Secondary friction areas include **SIP Mandate & Payment Processing Delays (20.0%)** and **App Experience & Portfolio Tracking (20.0%)**.

Top 3 Prioritized Themes:
1. **Pricing & Unexpected Exit Load Charges (40.0%):** Users report surprise deductions (1% exit load) when redeeming equity mutual funds before completing 365 days, alleging "hidden broker fees".
2. **SIP Mandate & Payment Processing Delays (20.0%):** BSE Star MF auto-pay glitches, delayed unit allotments, and confusion over NAV allocation dates.
3. **App Experience & Portfolio Tracking (20.0%):** Strong praise for dark mode UI, offset by requests for automated annual capital gains statements.

---

## 2. Supporting Real User Quotes
* **Quote 1 (Flexi Cap Redemption):**  
  > *“I redeemed my HDFC Flexi Cap fund units after 8 months and noticed almost 1% was deducted as some fee called 'Exit Load'! Why was this not clearly shown on the sell screen? I thought mutual funds had zero withdrawal fees. Very disappointed with Groww.”*  
  > — **Aditya Sharma (Rating: 2/5)**

* **Quote 2 (Surprise Deduction at 5 Months):**  
  > *“Hidden charges everywhere. When I withdrew my money after 5 months, an exit load fee of ₹1,450 was cut from my balance. Nobody warned me during redemption that 1 year wasn't completed. Your app must show exit load warnings before confirming order!”*  
  > — **Pooja Hegde (Rating: 1/5)**

* **Quote 3 (Near-Cutoff Penalty):**  
  > *“Exit load was charged on my mutual fund redemption because I missed the 1-year cutoff by literally 12 days! A simple date pill on the portfolio screen would prevent this for thousands of users.”*  
  > — **Swati Deshmukh (Rating: 2/5)**

---

## 3. Key Observation (What’s Going Wrong)
Retail investors heavily misunderstand mutual fund **Exit Loads**. Over 40% of negative reviews mistake the AMC's statutory 1.0% early redemption penalty for broker commission charged by Groww. Because Groww markets itself as a zero-commission direct mutual fund platform, users assume that all redemptions are 100% free at any time. Furthermore, users prematurely redeem funds mere days or weeks before the 365-day threshold without being alerted.

---

## 4. 3 Concrete Action Ideas for the Product Team
1. **Exit Load Countdown Pill on Sell Screen:**  
   Introduce a proactive visual badge on the redemption order screen showing: *"Hold for X more days to redeem with 0% exit load"* before asking for T-PIN confirmation.
2. **Estimated Net Payout Breakdown:**  
   In the redemption confirmation drawer, provide an instant calculation showing Gross Value, Estimated AMC Exit Load (1%), and Net Estimated Payout into the bank account.
3. **Portfolio Holding Warning Badges:**  
   Flag mutual fund holdings approaching 1 year with a subtle *"Exit Load Free Soon"* chip in the portfolio view to prevent accidental premature redemptions.
