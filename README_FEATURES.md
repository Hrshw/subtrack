# New Features Implementation Guide

## 1. Cute Sticky Robot Assistant 🤖
- **Location**: Bottom-right of the Dashboard.
- **Behavior**: Cycles through helpful/savage tips every 5 seconds.
- **Interaction**: Click to toggle visibility. Click "Upgrade Now" inside the bubble to go to Pricing.
- **Tech**: Framer Motion for animations.

## 2. Export to PDF Report 📄
- **Location**: "Export Report" button in Dashboard header.
- **Functionality**: Captures the entire dashboard (excluding the robot) and downloads a PDF named `SubTrack_Report_YYYY-MM-DD.pdf`.
- **Tech**: `html2canvas` + `jspdf`.

## 3. Insane Pricing Page 💸
- **Location**: `/pricing`
- **Features**:
    - ROI Calculator: Updates dynamically based on user input.
    - Annual/Monthly Toggle: Shows savings.
    - Confetti: Triggers on "Upgrade" click.
    - Testimonials: Mock tweets from indie hackers.
    - Design: Dark mode, glassmorphism, gradients.

## 4. Savage AI Mode 😈
- **Logic**: If a user is on the **Pro** plan, the AI recommendations become "savage" (roasting, slang, direct).
- **Implementation**: `RuleEngine` checks user tier and passes `style: 'savage'` to Gemini.
- **Testing**: Update your user in MongoDB: `db.users.updateOne({email: "..."}, {$set: {subscriptionStatus: "pro"}})` to see savage mode.

## 5. AWS Deep Scan (Simulated) ☁️
- **Logic**: The AWS integration now simulates a deep scan finding:
    - Stopped EC2 instances (Zombie).
    - Large EC2 instances (Overprovisioned).
    - Lambda functions.
    - S3 buckets.
- **Implementation**: `IntegrationService` mocks this data, and `RuleEngine` analyzes it.

## 6. Mobile Responsiveness 📱
- All new pages are fully responsive.
