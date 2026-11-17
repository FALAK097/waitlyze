/**
 * Standardized PostHog Event Names for Waitlyze
 * Namespaced by domain to prevent collisions and maintain taxonomy clarity.
 */
export const POSTHOG_EVENTS = Object.freeze({
  // A. Acquisition & Marketing
  MARKETING_PAGE_VIEWED: "marketing:page_viewed",
  MARKETING_SIGNUP_STARTED: "marketing:signup_started",
  MARKETING_SIGNUP_COMPLETED: "marketing:signup_completed",
  MARKETING_LOGIN_COMPLETED: "marketing:login_completed",
  MARKETING_PRICING_VIEWED: "marketing:pricing_viewed",
  MARKETING_CHECKOUT_STARTED_FROM_PRICING: "marketing:checkout_started_from_pricing",

  // B. Workspace
  WORKSPACE_CREATED: "workspace:created",
  WORKSPACE_UPDATED: "workspace:updated",
  WORKSPACE_MEMBER_INVITED: "workspace:member_invited",
  WORKSPACE_MEMBER_JOINED: "workspace:member_joined",
  WORKSPACE_MEMBER_REMOVED: "workspace:member_removed",

  // C. Onboarding
  ONBOARDING_TOUR_STARTED: "onboarding:tour_started",
  ONBOARDING_TOUR_STEP_VIEWED: "onboarding:tour_step_viewed",
  ONBOARDING_TOUR_FINISHED: "onboarding:tour_finished",

  // D. Waitlist
  WAITLIST_CREATED: "waitlist:created",
  WAITLIST_UPDATED: "waitlist:updated",
  WAITLIST_PUBLISHED: "waitlist:published",
  WAITLIST_UNPUBLISHED: "waitlist:unpublished",
  WAITLIST_DELETED: "waitlist:deleted",
  WAITLIST_SIGNUP_RECEIVED: "waitlist:signup_received",
  WAITLIST_MILESTONE_REACHED: "waitlist:milestone_reached",

  // E. Referral
  REFERRAL_CAMPAIGN_CREATED: "referral:campaign_created",
  REFERRAL_CAMPAIGN_UPDATED: "referral:campaign_updated",
  REFERRAL_LINK_SHARED: "referral:link_shared",
  REFERRAL_CONVERSION_RECEIVED: "referral:conversion_received",
  REFERRAL_REWARD_UNLOCKED: "referral:reward_unlocked",
  REFERRAL_REWARD_CLAIMED: "referral:reward_claimed",

  // F. Feature Engagement
  ANALYTICS_REPORT_VIEWED: "analytics:report_viewed",
  INTEGRATION_CONNECTED: "integration:connected",
  INTEGRATION_DISCONNECTED: "integration:disconnected",
  WEBHOOK_CREATED: "webhook:created",
  WEBHOOK_DELIVERY_FAILED: "webhook:delivery_failed",
  EXPORT_DOWNLOADED: "export:downloaded",
  DOMAIN_CONNECTED: "domain:connected",
  DOMAIN_VERIFIED: "domain:verified",
  EMAIL_DELIVERY_FAILED: "email:delivery_failed",
  API_REQUEST_FAILED: "api:request_failed",

  // G. Billing
  BILLING_UPGRADE_CLICKED: "billing:upgrade_clicked",
  BILLING_CHECKOUT_STARTED: "billing:checkout_started",
  BILLING_SUBSCRIPTION_CREATED: "billing:subscription_created",
  BILLING_SUBSCRIPTION_UPDATED: "billing:subscription_updated",
  BILLING_SUBSCRIPTION_CANCELLED: "billing:subscription_cancelled",
  BILLING_PAYMENT_FAILED: "billing:payment_failed",
  BILLING_REFUND_PROCESSED: "billing:refund_processed",
});
