/**
 * API Configuration
 * Central configuration for API endpoints and settings
 */

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
  timeout: 30000, // 30 seconds
  headers: {
    "Content-Type": "application/json",
  },
} as const;

export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
    refresh: "/auth/refresh",
  },

  // Class Registration
  classRegistration: {
    base: "/class-registration",
  },

  // Email
  email: {
    messages: {
      base: "/email/messages",
      sync: "/email/messages/sync",
      byId: (id: number) => `/email/messages/${id}`,
    },
    messageLabels: {
      update: "/email/messageLabels",
    },
    labels: {
      base: "/email/labels",
      gmailLabels: "/email/labels/gmailLabels",
      autoCreate: "/email/labels/autoCreate",
    },
    allowedDomains: {
      base: "/email/allowedDomains",
    },
    grants: {
      base: "/email/grants",
    },
  },

  // Inquiry
  inquiry: {
    base: "/inquiry",
  },
} as const;
