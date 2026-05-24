/**
 * API Configuration
 * Central configuration for API endpoints and settings
 */

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
  ragBaseURL: import.meta.env.VITE_RAG_API_BASE_URL || "http://localhost:8000",
  appURL: import.meta.env.VITE_APP_URL || `${window.location.origin}/`,
  timeout: 30000, // 30 seconds
} as const;

export const API_ENDPOINTS = {
  // Authentication
  auth: {
    googleUrl: "/authentication/google",
    googleCallback: "/authentication/google",
    googleGmailGrant: "/authentication/google/grant-gmail",
    refresh: "/authentication/auth/refresh",
    logout: "/authentication/auth/logout",
    me: "/authentication/auth/me",
  },

  // Authentication - Users
  authentication: {
    users: {
      base: "/authentication/users",
      byId: (id: number) => `/authentication/users/${id}`,
      assignRole: "/authentication/users/assignRole",
    },
    students: {
      base: "/authentication/students",
      byId: (id: number) => `/authentication/students/${id}`,
      import: "/authentication/students/import",
    },
  },

  // Class Registration
  classRegistration: {
    registrations: {
      base: "/classRegistration/classRegistrations",
      byId: (id: number) => `/classRegistration/classRegistrations/${id}`,
      stats: "/classRegistration/classRegistrations/stats",
      previewReply: (id: number) =>
        `/classRegistration/classRegistrations/${id}/reply`,
      reply: (id: number) =>
        `/classRegistration/classRegistrations/${id}/reply`,
      items: (parentId: number) =>
        `/classRegistration/classRegistrations/${parentId}/items`,
      itemById: (parentId: number, id: number) =>
        `/classRegistration/classRegistrations/${parentId}/items/${id}`,
      itemsOverview: (parentId: number) =>
        `/classRegistration/classRegistrations/${parentId}/items/overview`,
      itemsBulkStatus: (parentId: number) =>
        `/classRegistration/classRegistrations/${parentId}/items/bulkStatus`,
    },
    cancelReasons: {
      base: "/classRegistration/cancelReasons",
      byId: (id: number) => `/classRegistration/cancelReasons/${id}`,
    },
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
    canSaveContent: {
      base: "/email/canSaveContent",
    },
  },

  // Shared
  shared: {
    settings: "/shared/settings",
    settingsByKey: (key: string) => `/shared/settings/${key}`,
    dashboardTodaySummary: "/shared/dashboard/today-summary",
  },

  // Inquiry
  inquiry: {
    inquiries: {
      base: "/inquiry/inquiries",
      byId: (id: number) => `/inquiry/inquiries/${id}`,
      stats: "/inquiry/inquiries/stats",
      previewReply: (id: number) => `/inquiry/inquiries/${id}/reply`,
      reply: (id: number) => `/inquiry/inquiries/${id}/reply`,
    },
  },

  // Task
  task: {
    tasks: {
      base: "/task/tasks",
      byId: (id: number) => `/task/tasks/${id}`,
      stats: "/task/tasks/stats",
    },
  },

  // Documents (Nest API)
  document: {
    accesses: {
      base: "/document/files/accesses",
      recent: "/document/files/accesses/recent",
    },
    bookmarks: {
      base: "/document/files/bookmarks",
      byId: (fileId: string) => `/document/files/bookmarks/${fileId}`,
    },
  },

  // RAG API (Python)
  rag: {
    files: {
      base: "/api/files",
      byId: (fileId: string) => `/api/files/${fileId}`,
      download: (fileId: string) => `/api/files/${fileId}/download`,
      progress: (clientId: string) => `/api/files/progress/${clientId}`,
    },
    metadata: {
      base: "/api/metadata",
      byId: (key: string) => `/api/metadata/${key}`,
      values: (key: string) => `/api/metadata/${key}/values`,
      valueById: (key: string, value: string) =>
        `/api/metadata/${key}/values/${value}`,
    },
    faqs: {
      base: "/api/faqs",
      byId: (id: string) => `/api/faqs/${id}`,
      import: "/api/faqs/import",
      importPreview: "/api/faqs/import/preview",
      candidates: "/api/faqs/candidates/list",
      reviewCandidate: (id: string) => `/api/faqs/candidates/${id}/review`,
    },
    forms: {
      base: "/api/forms",
      byId: (id: string) => `/api/forms/${id}`,
      import: "/api/forms/import",
      importPreview: "/api/forms/import-preview",
    },
    chat: {
      stream: "/api/chat/stream",
      sessions: {
        base: "/api/chat/sessions",
        byId: (sessionId: string) => `/api/chat/sessions/${sessionId}`,
        messages: (sessionId: string) =>
          `/api/chat/sessions/${sessionId}/messages`,
        archive: (sessionId: string) =>
          `/api/chat/sessions/${sessionId}/archive`,
      },
    },
  },
} as const;
