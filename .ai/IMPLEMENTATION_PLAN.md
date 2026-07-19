# Implementation Plan — Current DEV Cycle (Auth & Billing Phases 1.6 - 5)

Complete phases 1.6 through 5 of the Auth and Billing program.

## Proposed Changes

- **Database Layer**: Add SaaSCoupon, SaaSDiscount, AddOnPack, AddOnPurchase, SaaSPaymentMethod, PricingRule, QuotaRule schemas.
- **Shared Layer**: Extend loginSchema with captchaToken and registerSchema with businessDetails.
- **Backend Layer**: Add write-guard middleware, CAPTCHA verification service, provisioning tracking endpoint, strategy-based billing engine, CRON renewal worker, and Stripe/Razorpay adapters.
- **Frontend Layer**: Add CAPTCHA component on failed login, billing dashboards for customer/admin, and plan select UI.
