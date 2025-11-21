# Insights Section Upgrade Verification Guide

The "Your Insights" section has been completely overhauled to be a high-conversion driver. Here is how to verify the new features.

## 1. Setup
- Ensure the frontend is running: `npm run dev` in `frontend` directory.
- Ensure the backend is running: `npm run dev` in `backend` directory.

## 2. Test Scenarios

### Scenario A: Free User with Leaks (Default State)
1.  **Trigger**: Connect a service that generates leaks (or use existing data).
2.  **Verify**:
    -   **Header**: "Your Insights" with "Last scanned X mins ago".
    -   **Cards**: Red/Orange cards for leaks ("Zombie", "Downgrade").
    -   **Viral Nudge**: A special card saying "Pro fixes this automatically" with an Upgrade button.
    -   **Analytics**: "Detailed Analytics" section is visible *below* the cards.

### Scenario B: Free User - Healthy (Cost Champion)
1.  **Trigger**: Connect a service with NO leaks (or clear leaks in DB).
2.  **Verify**:
    -   **Visuals**: Big "Cost Champion" Trophy animation.
    -   **Text**: "Saved ₹15,000/year by staying optimal".
    -   **Nudge**: "Pro users save 4x more with zero effort 😏".
    -   **Confetti**: Confetti should pop on the screen (first time only).

### Scenario C: Pro User - Healthy (Legend Status)
1.  **Trigger**: Change `subscriptionStatus` to `'pro'` in `frontend/src/pages/Dashboard.tsx` (line 51).
2.  **Verify**:
    -   **Visuals**: "Absolute Legend Status" Crown animation.
    -   **Text**: "Top 1% of savers · ₹1,08,000/year saved".
    -   **Badge**: "PRO" badge next to "Your Insights" header.

### Scenario D: Detailed Modal
1.  **Trigger**: Click on any Leak card.
2.  **Verify**:
    -   A beautiful modal opens.
    -   Shows "Potential Savings", "AI Insight", and "Detected X mins ago".
    -   "Take Action" button is present.

## 3. Technical Checks
-   **Responsiveness**: Check on mobile view. Cards should stack.
-   **Performance**: Animations (framer-motion) should be smooth.
-   **Data**: "Last scanned" time should update after a scan.

## 4. Troubleshooting
-   If "Last scanned" says "Never", ensure a scan has been triggered.
-   If Confetti doesn't show, clear `localStorage.removeItem('hasSeenChampionConfetti')` in console.
