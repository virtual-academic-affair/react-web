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
    googleUrl: "/authentication/google",       // GET  → lấy Google Auth URL
    googleCallback: "/authentication/google",  // POST → đổi code → tokens
    refresh: "/authentication/auth/refresh", // POST → refresh tokens
  },

  // Authentication - Users
  authentication: {
    users: {
      base: "/authentication/users",
      byId: (id: number) => `/authentication/users/${id}`,
      assignRole: "/authentication/users/assignRole",
    },
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
      byIdLabels: (id: number) => `/email/messages/${id}/labels`,
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

  // Shared
  shared: {
    dynamicData: "/shared/dynamic-data",
  },

  // Inquiry
  inquiry: {
    base: "/inquiry",
  },
} as const;
