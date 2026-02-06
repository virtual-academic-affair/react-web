/**
 * Email Services Entry Point
 * Aggregates all email-related services
 */

export { allowedDomainsService } from "./allowedDomains.service";
export { grantsService } from "./grants.service";
export { labelsService } from "./labels.service";
export { messageLabelsService } from "./messageLabels.service";
export { messagesService } from "./messages.service";

// Re-export for convenience
export * from "@/types/email";
