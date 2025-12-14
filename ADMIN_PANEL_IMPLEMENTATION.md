# Admin Panel Implementation Guide

> **Project Status**: Future Separate Project  
> **Last Updated**: December 14, 2025  
> **Version**: 1.0.0

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Security Requirements](#security-requirements)
5. [Core Features](#core-features)
6. [Authentication & Authorization](#authentication--authorization)
7. [API Endpoints](#api-endpoints)
8. [Database Schema Extensions](#database-schema-extensions)
9. [Implementation Roadmap](#implementation-roadmap)
10. [Security Best Practices](#security-best-practices)
11. [Monitoring & Logging](#monitoring--logging)
12. [Deployment Strategy](#deployment-strategy)

---

## Overview

The EightBlock Admin Panel will be a completely separate, secure application for managing the entire blog platform. It will provide comprehensive control over users, articles, analytics, content moderation, and system configuration.

### Key Objectives

- **Separation of Concerns**: Independent codebase from the public-facing app
- **Enhanced Security**: Multi-layer authentication and authorization
- **Comprehensive Management**: Full control over all platform resources
- **Real-time Analytics**: Dashboard with live statistics and insights
- **Audit Trail**: Complete logging of all administrative actions
- **Role-based Access**: Granular permissions for different admin levels

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Panel (Separate App)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Next.js    │  │  Admin API   │  │   Redis      │     │
│  │   Frontend   │←→│   Gateway    │←→│   Cache      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    ┌──────────────┐
                    │  Auth Layer  │
                    │  JWT + 2FA   │
                    └──────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Shared Backend Services                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PostgreSQL  │  │  Redis       │  │  File        │     │
│  │  Database    │  │  Sessions    │  │  Storage     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure

```
eightblock-admin/
├── frontend/                 # Next.js admin frontend
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── verify-2fa/
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── articles/
│   │   ├── analytics/
│   │   ├── moderation/
│   │   ├── settings/
│   │   └── audit-logs/
│   ├── components/
│   │   ├── charts/
│   │   ├── tables/
│   │   ├── modals/
│   │   └── forms/
│   └── lib/
│       ├── api-client.ts
│       ├── auth.ts
│       └── permissions.ts
├── backend/                  # Admin-specific API
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── admin-auth.controller.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── articles.controller.ts
│   │   │   ├── analytics.controller.ts
│   │   │   └── audit.controller.ts
│   │   ├── middleware/
│   │   │   ├── admin-auth.middleware.ts
│   │   │   ├── permission.middleware.ts
│   │   │   ├── rate-limit.middleware.ts
│   │   │   └── audit-log.middleware.ts
│   │   ├── services/
│   │   │   ├── admin.service.ts
│   │   │   ├── analytics.service.ts
│   │   │   └── moderation.service.ts
│   │   └── utils/
│   │       ├── 2fa.ts
│   │       └── encryption.ts
│   └── prisma/
│       └── schema.prisma
├── shared/                   # Shared types and utilities
│   └── types/
└── docker-compose.yml
```

---

## Technology Stack

### Frontend

- **Framework**: Next.js 15+ (App Router)
- **UI Library**: shadcn/ui + Radix UI
- **State Management**: Zustand or React Context
- **Data Fetching**: TanStack Query (React Query)
- **Charts**: Recharts or Chart.js
- **Tables**: TanStack Table
- **Forms**: React Hook Form + Zod validation

### Backend

- **Runtime**: Node.js 20+ with Express
- **Language**: TypeScript
- **ORM**: Prisma
- **Authentication**: JWT + 2FA (TOTP)
- **Session Management**: Redis
- **Rate Limiting**: Redis + express-rate-limit
- **Email**: SendGrid or AWS SES
- **File Storage**: AWS S3 or local (production/dev)

### Database

- **Primary**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Search**: PostgreSQL Full-Text Search or ElasticSearch (future)

### Security Tools

- **2FA**: speakeasy (TOTP)
- **Password Hashing**: bcrypt
- **Encryption**: crypto (AES-256-GCM)
- **CSRF Protection**: csurf
- **Rate Limiting**: express-rate-limit + Redis
- **Input Validation**: Zod
- **SQL Injection Prevention**: Prisma (parameterized queries)
- **XSS Prevention**: DOMPurify + helmet

---

## Security Requirements

### 1. Authentication Security

#### Multi-Factor Authentication (2FA)

```typescript
// Implementation using TOTP (Time-based One-Time Password)
interface TwoFactorSetup {
  secret: string; // Generated secret
  qrCode: string; // QR code for authenticator app
  backupCodes: string[]; // Emergency backup codes
}

// Admin user must enable 2FA on first login
// Backup codes stored hashed in database
```

#### JWT Token Strategy

```typescript
interface AdminTokens {
  accessToken: string; // Short-lived (15 minutes)
  refreshToken: string; // Long-lived (7 days), stored in httpOnly cookie
}

// Token payload
interface AdminTokenPayload {
  adminId: string;
  email: string;
  role: AdminRole;
  permissions: string[];
  sessionId: string;
  iat: number;
  exp: number;
}
```

#### Session Management

```typescript
// Redis-based session tracking
interface AdminSession {
  sessionId: string;
  adminId: string;
  ipAddress: string;
  userAgent: string;
  lastActivity: Date;
  expiresAt: Date;
}

// Automatic session invalidation on:
// - Password change
// - Role/permission change
// - Manual logout
// - Inactivity timeout (30 minutes)
// - Concurrent session limit (max 3 devices)
```

### 2. Authorization & Permissions

#### Role-Based Access Control (RBAC)

```typescript
enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN', // Full system access
  ADMIN = 'ADMIN', // Most features
  MODERATOR = 'MODERATOR', // Content moderation
  ANALYST = 'ANALYST', // Read-only analytics
  SUPPORT = 'SUPPORT', // User support
}

interface Permission {
  resource: string; // e.g., 'users', 'articles', 'settings'
  action: string; // e.g., 'create', 'read', 'update', 'delete'
  conditions?: object; // Optional conditions
}

// Permission matrix
const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  SUPER_ADMIN: ['*'], // All permissions

  ADMIN: [
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'update' },
    { resource: 'users', action: 'suspend' },
    { resource: 'articles', action: '*' },
    { resource: 'analytics', action: 'read' },
    { resource: 'moderation', action: '*' },
  ],

  MODERATOR: [
    { resource: 'users', action: 'read' },
    { resource: 'articles', action: 'read' },
    { resource: 'articles', action: 'update' },
    { resource: 'articles', action: 'delete' },
    { resource: 'moderation', action: '*' },
  ],

  ANALYST: [
    { resource: 'analytics', action: 'read' },
    { resource: 'users', action: 'read' },
    { resource: 'articles', action: 'read' },
  ],

  SUPPORT: [
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'update', conditions: { field: 'email' } },
    { resource: 'articles', action: 'read' },
  ],
};
```

#### Permission Middleware

```typescript
// Express middleware for permission checking
function requirePermission(resource: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const admin = req.admin; // From auth middleware

    if (!hasPermission(admin.role, resource, action)) {
      await logAuditEvent({
        adminId: admin.id,
        action: 'ACCESS_DENIED',
        resource,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.status(403).json({
        error: 'Insufficient permissions',
      });
    }

    next();
  };
}
```

### 3. Rate Limiting

```typescript
// Different rate limits for different endpoints
const RATE_LIMITS = {
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: 'Too many login attempts',
  },

  api: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests
    message: 'Rate limit exceeded',
  },

  bulkOperations: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 operations
    message: 'Bulk operation limit exceeded',
  },
};
```

### 4. IP Whitelisting (Optional)

```typescript
// Restrict admin access to specific IP ranges
const ALLOWED_IP_RANGES = [
  '192.168.1.0/24', // Office network
  '10.0.0.0/8', // VPN
  // Add production IPs
];

// Middleware to check IP
function ipWhitelistMiddleware(req: Request, res: Response, next: NextFunction) {
  const clientIp = req.ip;

  if (!isIpAllowed(clientIp, ALLOWED_IP_RANGES)) {
    await logSecurityEvent({
      type: 'IP_BLOCKED',
      ip: clientIp,
      userAgent: req.headers['user-agent'],
    });

    return res.status(403).json({
      error: 'Access denied from this IP',
    });
  }

  next();
}
```

### 5. Input Validation & Sanitization

```typescript
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Example validation schemas
const updateUserSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(2).max(100),
  bio: z.string().max(500).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED']),
});

const updateArticleSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(100),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  tags: z.array(z.string()).max(10),
});

// Sanitize HTML content
function sanitizeHtml(content: string): string {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}
```

### 6. CSRF Protection

```typescript
import csurf from 'csurf';

// CSRF middleware
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
});

// Apply to all state-changing operations
app.use('/api/admin', csrfProtection);

// Frontend must include CSRF token in requests
// Token available via /api/admin/csrf endpoint
```

---

## Core Features

### 1. Dashboard

#### Overview Metrics

```typescript
interface DashboardMetrics {
  // User metrics
  totalUsers: number;
  activeUsers: number; // Active in last 30 days
  newUsersToday: number;
  newUsersThisWeek: number;

  // Article metrics
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  articlesToday: number;

  // Engagement metrics
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalBookmarks: number;

  // System metrics
  storageUsed: number; // In bytes
  bandwidthUsed: number; // In bytes
  apiCallsToday: number;
  errorRate: number; // Percentage

  // Growth metrics
  userGrowthRate: number; // Percentage
  contentGrowthRate: number; // Percentage
  engagementRate: number; // Percentage
}
```

#### Real-time Statistics

```typescript
// WebSocket connection for live updates
interface RealtimeStats {
  onlineUsers: number;
  activeReaders: number; // Currently reading articles
  recentActivities: Activity[];
  serverHealth: {
    cpu: number;
    memory: number;
    uptime: number;
  };
}
```

#### Charts & Visualizations

- **User Growth Chart**: Line chart showing user signups over time
- **Content Performance**: Bar chart of top articles by views
- **Engagement Trends**: Multi-line chart (likes, comments, bookmarks)
- **Geographic Distribution**: Map showing user locations
- **Device Analytics**: Pie chart (desktop vs mobile)
- **Traffic Sources**: Donut chart (direct, social, search)

### 2. User Management

#### User List & Search

```typescript
interface UserFilters {
  search?: string; // Search by name, email, wallet
  status?: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  role?: 'USER' | 'ADMIN';
  dateFrom?: Date;
  dateTo?: Date;
  hasArticles?: boolean;
  minArticles?: number;
  sortBy?: 'createdAt' | 'articles' | 'views' | 'engagement';
  sortOrder?: 'asc' | 'desc';
  page: number;
  limit: number;
}

interface UserListResponse {
  users: AdminUserView[];
  total: number;
  page: number;
  totalPages: number;
}

interface AdminUserView {
  id: string;
  walletAddress: string;
  name: string | null;
  email: string | null;
  bio: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  createdAt: Date;
  lastLoginAt: Date | null;

  // Aggregated stats
  stats: {
    totalArticles: number;
    publishedArticles: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    followers: number;
    following: number;
  };
}
```

#### User Actions

```typescript
// Suspend user (temporary)
async function suspendUser(
  userId: string,
  reason: string,
  duration?: number // In days, undefined = indefinite
): Promise<void>;

// Ban user (permanent)
async function banUser(userId: string, reason: string): Promise<void>;

// Reactivate user
async function reactivateUser(userId: string, note?: string): Promise<void>;

// Update user profile (admin override)
async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<User>;

// Delete user (hard delete - use with caution)
async function deleteUser(
  userId: string,
  reason: string,
  deleteContent: boolean // Delete all user's articles?
): Promise<void>;

// Reset user password (send reset email)
async function resetUserPassword(userId: string): Promise<void>;

// View user activity log
async function getUserActivityLog(userId: string, limit: number): Promise<Activity[]>;
```

### 3. Article Management

#### Article List & Moderation

```typescript
interface ArticleFilters {
  search?: string; // Search by title, content, tags
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  authorId?: string;
  categoryId?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  minViews?: number;
  maxViews?: number;
  flagged?: boolean; // Reported by users
  sortBy?: 'createdAt' | 'views' | 'likes' | 'comments';
  sortOrder?: 'asc' | 'desc';
  page: number;
  limit: number;
}

interface AdminArticleView {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string | null;
  status: ArticleStatus;
  authorId: string;
  author: {
    name: string;
    walletAddress: string;
  };
  tags: string[];
  createdAt: Date;
  publishedAt: Date | null;
  updatedAt: Date;

  // Moderation info
  flagged: boolean;
  flagReasons: string[];
  flagCount: number;

  // Statistics
  stats: {
    views: number;
    uniqueViews: number;
    likes: number;
    comments: number;
    bookmarks: number;
    shares: number;
    readTime: number; // Average in seconds
  };
}
```

#### Article Actions

```typescript
// Feature article (show on homepage)
async function featureArticle(
  articleId: string,
  position?: number // Order on homepage
): Promise<void>;

// Unfeature article
async function unfeatureArticle(articleId: string): Promise<void>;

// Archive article (hide but keep)
async function archiveArticle(articleId: string, reason: string): Promise<void>;

// Delete article (hard delete)
async function deleteArticle(
  articleId: string,
  reason: string,
  notifyAuthor: boolean
): Promise<void>;

// Update article status
async function updateArticleStatus(
  articleId: string,
  status: ArticleStatus,
  reason?: string
): Promise<void>;

// Edit article content (admin override)
async function editArticle(
  articleId: string,
  updates: Partial<Article>,
  reason: string
): Promise<Article>;

// Resolve flags/reports
async function resolveArticleFlags(
  articleId: string,
  action: 'DISMISS' | 'WARN_AUTHOR' | 'ARCHIVE' | 'DELETE',
  note: string
): Promise<void>;
```

### 4. Analytics Dashboard

#### Comprehensive Analytics

```typescript
interface AnalyticsData {
  // Time-series data
  timeSeries: {
    date: Date;
    users: number;
    articles: number;
    views: number;
    engagement: number;
  }[];

  // Top content
  topArticles: {
    article: AdminArticleView;
    views: number;
    engagementRate: number;
  }[];

  // Top authors
  topAuthors: {
    user: AdminUserView;
    articles: number;
    totalViews: number;
    avgEngagement: number;
  }[];

  // Traffic sources
  trafficSources: {
    source: string; // 'direct', 'social', 'search', etc.
    visits: number;
    percentage: number;
  }[];

  // Geographic data
  geographicData: {
    country: string;
    countryCode: string;
    users: number;
    sessions: number;
  }[];

  // Device data
  deviceData: {
    type: 'desktop' | 'mobile' | 'tablet';
    count: number;
    percentage: number;
  }[];

  // Engagement metrics
  engagement: {
    avgSessionDuration: number; // In seconds
    bounceRate: number; // Percentage
    pagesPerSession: number;
    avgReadTime: number; // In seconds
  };

  // Retention metrics
  retention: {
    day1: number; // Percentage
    day7: number;
    day30: number;
  };
}
```

#### Export Functionality

```typescript
// Export analytics data
async function exportAnalytics(
  format: 'CSV' | 'JSON' | 'PDF',
  dateRange: { from: Date; to: Date },
  metrics: string[]
): Promise<Buffer>;

// Schedule automated reports
async function scheduleReport(
  schedule: 'daily' | 'weekly' | 'monthly',
  recipients: string[],
  format: 'CSV' | 'PDF'
): Promise<void>;
```

### 5. Content Moderation

#### Flagged Content Queue

```typescript
interface FlaggedContent {
  id: string;
  contentType: 'ARTICLE' | 'COMMENT' | 'USER';
  contentId: string;
  content: AdminArticleView | Comment | AdminUserView;

  flags: {
    reporterId: string;
    reporter: {
      name: string;
      walletAddress: string;
    };
    reason: string;
    category: 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE' | 'COPYRIGHT' | 'OTHER';
    description: string;
    reportedAt: Date;
  }[];

  status: 'PENDING' | 'REVIEWING' | 'RESOLVED';
  assignedTo: string | null;
  resolvedBy: string | null;
  resolvedAt: Date | null;
  resolution: string | null;
}
```

#### Moderation Actions

```typescript
// Review flagged content
async function reviewFlaggedContent(
  flagId: string,
  action: {
    decision: 'DISMISS' | 'WARN' | 'REMOVE' | 'BAN_USER';
    note: string;
    notifyReporter: boolean;
    notifyAuthor: boolean;
  }
): Promise<void>;

// Bulk moderation
async function bulkModerate(flagIds: string[], action: 'DISMISS' | 'REMOVE'): Promise<void>;

// Add to blacklist
async function addToBlacklist(
  type: 'WORD' | 'IP' | 'EMAIL',
  value: string,
  reason: string
): Promise<void>;

// Auto-moderation rules
interface ModerationRule {
  id: string;
  name: string;
  type: 'KEYWORD' | 'PATTERN' | 'ML';
  condition: string;
  action: 'FLAG' | 'AUTO_REMOVE' | 'REQUIRE_REVIEW';
  enabled: boolean;
}
```

### 6. System Settings

#### Platform Configuration

```typescript
interface SystemSettings {
  // General settings
  siteName: string;
  siteDescription: string;
  logoUrl: string;
  faviconUrl: string;

  // Content settings
  allowUserRegistration: boolean;
  requireEmailVerification: boolean;
  moderationMode: 'AUTO' | 'MANUAL' | 'HYBRID';
  defaultArticleStatus: 'DRAFT' | 'PUBLISHED';
  maxArticleLength: number;
  allowedImageFormats: string[];
  maxImageSize: number;

  // Security settings
  passwordMinLength: number;
  passwordRequireSpecialChar: boolean;
  sessionTimeout: number; // In minutes
  maxLoginAttempts: number;
  lockoutDuration: number; // In minutes

  // Email settings
  emailProvider: 'SENDGRID' | 'AWS_SES' | 'SMTP';
  emailFrom: string;
  emailReplyTo: string;

  // Storage settings
  storageProvider: 'LOCAL' | 'S3' | 'CLOUDINARY';
  storageQuota: number; // In GB
  cdnEnabled: boolean;
  cdnUrl: string;

  // Analytics settings
  googleAnalyticsId: string;
  enableAnalytics: boolean;
  trackingConsent: boolean;

  // Rate limiting
  apiRateLimit: number; // Requests per minute
  publicRateLimit: number;

  // Maintenance mode
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowedIpsDuringMaintenance: string[];
}
```

### 7. Audit Logs

#### Comprehensive Logging

```typescript
interface AuditLog {
  id: string;
  timestamp: Date;

  // Actor information
  adminId: string;
  adminEmail: string;
  adminRole: AdminRole;

  // Action details
  action: AuditAction;
  resource: string; // 'user', 'article', 'settings', etc.
  resourceId: string | null;

  // Request details
  ipAddress: string;
  userAgent: string;
  method: string; // HTTP method
  endpoint: string;

  // Changes
  before: Record<string, any> | null;
  after: Record<string, any> | null;

  // Additional context
  reason: string | null;
  status: 'SUCCESS' | 'FAILURE';
  errorMessage: string | null;
}

enum AuditAction {
  // Authentication
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',

  // User actions
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_SUSPENDED = 'USER_SUSPENDED',
  USER_BANNED = 'USER_BANNED',
  USER_DELETED = 'USER_DELETED',

  // Article actions
  ARTICLE_UPDATED = 'ARTICLE_UPDATED',
  ARTICLE_DELETED = 'ARTICLE_DELETED',
  ARTICLE_FEATURED = 'ARTICLE_FEATURED',
  ARTICLE_ARCHIVED = 'ARTICLE_ARCHIVED',

  // Settings
  SETTINGS_UPDATED = 'SETTINGS_UPDATED',

  // Moderation
  CONTENT_FLAGGED = 'CONTENT_FLAGGED',
  FLAG_RESOLVED = 'FLAG_RESOLVED',

  // Security
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // System
  BACKUP_CREATED = 'BACKUP_CREATED',
  MAINTENANCE_MODE_TOGGLED = 'MAINTENANCE_MODE_TOGGLED',
}
```

#### Audit Log Queries

```typescript
// Search audit logs
async function searchAuditLogs(filters: {
  adminId?: string;
  action?: AuditAction;
  resource?: string;
  dateFrom?: Date;
  dateTo?: Date;
  ipAddress?: string;
  status?: 'SUCCESS' | 'FAILURE';
  search?: string;
  page: number;
  limit: number;
}): Promise<AuditLogListResponse>;

// Export audit logs
async function exportAuditLogs(filters: AuditLogFilters, format: 'CSV' | 'JSON'): Promise<Buffer>;
```

---

## API Endpoints

### Authentication Endpoints

```typescript
// POST /api/admin/auth/login
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  requiresTwoFactor: boolean;
  tempToken?: string; // For 2FA verification
  accessToken?: string;
  refreshToken?: string;
  admin?: AdminProfile;
}

// POST /api/admin/auth/verify-2fa
interface Verify2FARequest {
  tempToken: string;
  totpCode: string; // 6-digit code
}

// POST /api/admin/auth/setup-2fa
interface Setup2FAResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

// POST /api/admin/auth/confirm-2fa
interface Confirm2FARequest {
  secret: string;
  totpCode: string;
}

// POST /api/admin/auth/refresh
interface RefreshRequest {
  refreshToken: string;
}

// POST /api/admin/auth/logout
// POST /api/admin/auth/logout-all    // All sessions
```

### User Management Endpoints

```typescript
// GET /api/admin/users
// Query params: filters (UserFilters)

// GET /api/admin/users/:userId
// Detailed user info

// PATCH /api/admin/users/:userId
interface UpdateUserRequest {
  name?: string;
  email?: string;
  bio?: string;
  status?: UserStatus;
}

// POST /api/admin/users/:userId/suspend
interface SuspendUserRequest {
  reason: string;
  duration?: number; // Days
  notifyUser: boolean;
}

// POST /api/admin/users/:userId/ban
interface BanUserRequest {
  reason: string;
  notifyUser: boolean;
}

// POST /api/admin/users/:userId/reactivate
// DELETE /api/admin/users/:userId

// GET /api/admin/users/:userId/activity
// GET /api/admin/users/:userId/articles
// GET /api/admin/users/:userId/stats
```

### Article Management Endpoints

```typescript
// GET /api/admin/articles
// Query params: filters (ArticleFilters)

// GET /api/admin/articles/:articleId
// Detailed article info

// PATCH /api/admin/articles/:articleId
interface UpdateArticleRequest {
  title?: string;
  content?: string;
  status?: ArticleStatus;
  tags?: string[];
  reason: string;
}

// DELETE /api/admin/articles/:articleId
interface DeleteArticleRequest {
  reason: string;
  notifyAuthor: boolean;
}

// POST /api/admin/articles/:articleId/feature
// DELETE /api/admin/articles/:articleId/feature

// POST /api/admin/articles/:articleId/archive
interface ArchiveArticleRequest {
  reason: string;
  notifyAuthor: boolean;
}

// GET /api/admin/articles/:articleId/stats
// GET /api/admin/articles/:articleId/analytics
```

### Analytics Endpoints

```typescript
// GET /api/admin/analytics/dashboard
// Query params: dateRange

// GET /api/admin/analytics/users
// Query params: dateRange, groupBy

// GET /api/admin/analytics/articles
// Query params: dateRange, sortBy, limit

// GET /api/admin/analytics/engagement
// Query params: dateRange

// GET /api/admin/analytics/traffic
// Query params: dateRange

// GET /api/admin/analytics/geographic
// GET /api/admin/analytics/devices

// POST /api/admin/analytics/export
interface ExportAnalyticsRequest {
  format: 'CSV' | 'JSON' | 'PDF';
  dateRange: { from: Date; to: Date };
  metrics: string[];
}
```

### Moderation Endpoints

```typescript
// GET /api/admin/moderation/queue
// Query params: status, contentType

// GET /api/admin/moderation/flags/:flagId

// POST /api/admin/moderation/flags/:flagId/resolve
interface ResolveFlagRequest {
  decision: 'DISMISS' | 'WARN' | 'REMOVE' | 'BAN_USER';
  note: string;
  notifyReporter: boolean;
  notifyAuthor: boolean;
}

// POST /api/admin/moderation/bulk-resolve
interface BulkResolveRequest {
  flagIds: string[];
  action: 'DISMISS' | 'REMOVE';
}

// GET /api/admin/moderation/rules
// POST /api/admin/moderation/rules
// PATCH /api/admin/moderation/rules/:ruleId
// DELETE /api/admin/moderation/rules/:ruleId
```

### Settings Endpoints

```typescript
// GET /api/admin/settings
// PATCH /api/admin/settings
interface UpdateSettingsRequest {
  settings: Partial<SystemSettings>;
  reason: string;
}

// GET /api/admin/settings/backup
// POST /api/admin/settings/restore
```

### Audit Log Endpoints

```typescript
// GET /api/admin/audit-logs
// Query params: filters (AuditLogFilters)

// GET /api/admin/audit-logs/:logId

// POST /api/admin/audit-logs/export
interface ExportAuditLogsRequest {
  filters: AuditLogFilters;
  format: 'CSV' | 'JSON';
}
```

---

## Database Schema Extensions

### Admin Users Table

```prisma
model AdminUser {
  id                String    @id @default(cuid())
  email             String    @unique
  passwordHash      String
  name              String
  role              AdminRole @default(ADMIN)
  status            AdminUserStatus @default(ACTIVE)

  // 2FA
  twoFactorEnabled  Boolean   @default(false)
  twoFactorSecret   String?   // Encrypted
  backupCodes       String[]  // Hashed

  // Session management
  sessions          AdminSession[]

  // Audit trail
  auditLogs         AuditLog[]

  // Metadata
  lastLoginAt       DateTime?
  lastLoginIp       String?
  loginAttempts     Int       @default(0)
  lockedUntil       DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  createdById       String?

  @@index([email])
  @@index([status])
  @@map("admin_users")
}

enum AdminRole {
  SUPER_ADMIN
  ADMIN
  MODERATOR
  ANALYST
  SUPPORT
}

enum AdminUserStatus {
  ACTIVE
  SUSPENDED
  LOCKED
  DELETED
}
```

### Admin Sessions Table

```prisma
model AdminSession {
  id            String    @id @default(cuid())
  adminId       String
  admin         AdminUser @relation(fields: [adminId], references: [id], onDelete: Cascade)

  sessionToken  String    @unique
  ipAddress     String
  userAgent     String

  lastActivity  DateTime  @default(now())
  expiresAt     DateTime
  createdAt     DateTime  @default(now())

  @@index([adminId])
  @@index([sessionToken])
  @@index([expiresAt])
  @@map("admin_sessions")
}
```

### Audit Logs Table

```prisma
model AuditLog {
  id            String      @id @default(cuid())

  // Actor
  adminId       String
  admin         AdminUser   @relation(fields: [adminId], references: [id], onDelete: Cascade)
  adminEmail    String
  adminRole     AdminRole

  // Action
  action        AuditAction
  resource      String
  resourceId    String?

  // Request
  ipAddress     String
  userAgent     String
  method        String
  endpoint      String

  // Changes
  before        Json?
  after         Json?

  // Context
  reason        String?
  status        AuditStatus
  errorMessage  String?

  timestamp     DateTime    @default(now())

  @@index([adminId])
  @@index([action])
  @@index([resource])
  @@index([timestamp])
  @@map("audit_logs")
}

enum AuditStatus {
  SUCCESS
  FAILURE
}
```

### Flagged Content Table

```prisma
model FlaggedContent {
  id            String              @id @default(cuid())
  contentType   ContentType
  contentId     String

  flags         ContentFlag[]

  status        FlagStatus          @default(PENDING)
  assignedToId  String?
  assignedTo    AdminUser?          @relation("AssignedFlags", fields: [assignedToId], references: [id])
  resolvedById  String?
  resolvedBy    AdminUser?          @relation("ResolvedFlags", fields: [resolvedById], references: [id])
  resolvedAt    DateTime?
  resolution    String?

  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt

  @@index([status])
  @@index([contentType, contentId])
  @@map("flagged_content")
}

model ContentFlag {
  id              String          @id @default(cuid())
  flaggedContentId String
  flaggedContent  FlaggedContent  @relation(fields: [flaggedContentId], references: [id], onDelete: Cascade)

  reporterId      String
  reporter        User            @relation(fields: [reporterId], references: [id])

  reason          String
  category        FlagCategory
  description     String?

  reportedAt      DateTime        @default(now())

  @@index([flaggedContentId])
  @@index([reporterId])
  @@map("content_flags")
}

enum ContentType {
  ARTICLE
  COMMENT
  USER
}

enum FlagCategory {
  SPAM
  HARASSMENT
  INAPPROPRIATE
  COPYRIGHT
  MISINFORMATION
  OTHER
}

enum FlagStatus {
  PENDING
  REVIEWING
  RESOLVED
  DISMISSED
}
```

### System Settings Table

```prisma
model SystemSetting {
  id          String   @id @default(cuid())
  key         String   @unique
  value       Json
  category    String
  description String?

  updatedById String?
  updatedBy   AdminUser? @relation(fields: [updatedById], references: [id])
  updatedAt   DateTime   @updatedAt

  @@index([category])
  @@map("system_settings")
}
```

### Moderation Rules Table

```prisma
model ModerationRule {
  id          String          @id @default(cuid())
  name        String
  description String?
  type        RuleType
  condition   String          // Regex, keyword, or ML model ID
  action      RuleAction
  severity    Severity        @default(MEDIUM)
  enabled     Boolean         @default(true)

  createdById String
  createdBy   AdminUser       @relation(fields: [createdById], references: [id])
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  @@index([enabled])
  @@index([type])
  @@map("moderation_rules")
}

enum RuleType {
  KEYWORD
  PATTERN
  ML
}

enum RuleAction {
  FLAG
  AUTO_REMOVE
  REQUIRE_REVIEW
  NOTIFY_ADMIN
}

enum Severity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Goals**: Set up basic infrastructure and authentication

- [ ] Project initialization
  - Create separate repository
  - Set up monorepo structure (frontend + backend)
  - Configure TypeScript, ESLint, Prettier
  - Set up Docker development environment
- [ ] Database setup
  - Create admin-specific tables
  - Write Prisma migrations
  - Seed initial admin user
- [ ] Authentication system
  - Implement JWT authentication
  - Create login/logout endpoints
  - Set up session management with Redis
  - Implement password reset flow
- [ ] Basic frontend
  - Set up Next.js project
  - Create login page
  - Implement auth context
  - Create protected route wrapper

### Phase 2: Core Features (Weeks 3-5)

**Goals**: Build user and article management

- [ ] Dashboard
  - Create dashboard layout
  - Implement basic metrics
  - Add quick stats cards
  - Create navigation system
- [ ] User management
  - Build user list view with pagination
  - Implement search and filters
  - Create user detail view
  - Add suspend/ban/reactivate actions
  - Implement user edit functionality
- [ ] Article management
  - Build article list view
  - Implement search and filters
  - Create article detail view
  - Add archive/delete actions
  - Implement feature/unfeature functionality

### Phase 3: Security & 2FA (Weeks 6-7)

**Goals**: Enhance security measures

- [ ] Two-factor authentication
  - Implement TOTP generation
  - Create 2FA setup flow
  - Generate backup codes
  - Build 2FA verification page
- [ ] Role-based access control
  - Define permission system
  - Implement permission middleware
  - Create role management UI
  - Add permission checks to all endpoints
- [ ] Security enhancements
  - Implement CSRF protection
  - Add rate limiting
  - Set up IP whitelisting (optional)
  - Add security headers (helmet)

### Phase 4: Analytics & Moderation (Weeks 8-10)

**Goals**: Build analytics dashboard and content moderation

- [ ] Analytics system
  - Integrate with existing analytics
  - Create analytics dashboard
  - Build time-series charts
  - Implement top content views
  - Add geographic and device analytics
  - Create export functionality
- [ ] Content moderation
  - Build flagged content queue
  - Create moderation interface
  - Implement resolution workflows
  - Add bulk moderation actions
  - Create moderation rules system
  - Implement auto-moderation

### Phase 5: Audit & Settings (Weeks 11-12)

**Goals**: Complete audit logging and system settings

- [ ] Audit logging
  - Create audit log middleware
  - Build audit log viewer
  - Implement search and filters
  - Add export functionality
  - Create audit reports
- [ ] System settings
  - Build settings interface
  - Create configuration forms
  - Implement settings validation
  - Add backup/restore functionality
  - Create maintenance mode

### Phase 6: Polish & Testing (Weeks 13-14)

**Goals**: Testing, optimization, and documentation

- [ ] Testing
  - Write unit tests (>80% coverage)
  - Write integration tests
  - Write E2E tests for critical flows
  - Perform security testing
  - Conduct load testing
- [ ] Optimization
  - Optimize database queries
  - Implement query caching
  - Add request caching where appropriate
  - Optimize frontend bundle
  - Implement lazy loading
- [ ] Documentation
  - Write API documentation
  - Create admin user guide
  - Document deployment process
  - Create troubleshooting guide
  - Write security best practices

### Phase 7: Deployment (Week 15)

**Goals**: Deploy to production

- [ ] Production setup
  - Configure production environment
  - Set up CI/CD pipeline
  - Configure monitoring
  - Set up backup system
  - Deploy to VPS
- [ ] Go-live checklist
  - Final security audit
  - Performance testing
  - Create initial admin users
  - Train admin team
  - Launch! 🚀

---

## Security Best Practices

### Development

1. **Environment Variables**
   - Never commit `.env` files
   - Use different secrets for dev/staging/prod
   - Rotate secrets regularly
   - Store secrets in secure vault (e.g., AWS Secrets Manager)

2. **Code Security**
   - Use security linters (ESLint security plugins)
   - Regular dependency audits (`npm audit`)
   - Use Snyk or Dependabot for vulnerability scanning
   - Code review all changes
   - No hardcoded credentials

3. **Git Practices**
   - Never commit sensitive data
   - Use `.gitignore` properly
   - Sign commits with GPG
   - Protect main branch
   - Require PR reviews

### Deployment

1. **Server Hardening**
   - Keep system updated
   - Disable root login
   - Use SSH keys only (no passwords)
   - Configure firewall (UFW/iptables)
   - Enable fail2ban
   - Use non-standard SSH port

2. **Application Security**
   - Run as non-root user
   - Use HTTPS only (SSL/TLS)
   - Configure CORS properly
   - Set security headers
   - Enable rate limiting
   - Use WAF (Web Application Firewall)

3. **Database Security**
   - Use strong passwords
   - Restrict network access
   - Enable SSL connections
   - Regular backups
   - Encrypt sensitive data at rest
   - Use prepared statements (Prisma handles this)

4. **Redis Security**
   - Require password authentication
   - Bind to localhost only
   - Disable dangerous commands
   - Use SSL/TLS for connections
   - Regular backups

### Operational

1. **Access Control**
   - Principle of least privilege
   - Regular access reviews
   - Remove inactive accounts
   - Enforce strong passwords
   - Mandatory 2FA for all admins
   - IP whitelisting for admin access

2. **Monitoring**
   - Set up error tracking (Sentry)
   - Configure uptime monitoring
   - Monitor rate limits
   - Alert on suspicious activity
   - Track failed login attempts
   - Monitor resource usage

3. **Backup & Recovery**
   - Daily automated backups
   - Test restore procedures
   - Offsite backup storage
   - Version control for configs
   - Disaster recovery plan
   - Document recovery procedures

4. **Incident Response**
   - Define incident response plan
   - Document communication procedures
   - Regular security drills
   - Post-incident reviews
   - Update procedures based on learnings

---

## Monitoring & Logging

### Application Monitoring

```typescript
// Health check endpoint
app.get('/api/admin/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: await checkDatabaseHealth(),
    redis: await checkRedisHealth(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
  });
});
```

### Error Tracking

```typescript
// Sentry integration
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Error handler middleware
app.use(Sentry.Handlers.errorHandler());
```

### Logging Strategy

```typescript
// Use Winston for structured logging
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Log important events
logger.info('Admin login', {
  adminId: admin.id,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
});

logger.error('Failed authentication', {
  email: email,
  ipAddress: req.ip,
  reason: 'Invalid credentials',
});
```

### Metrics Collection

```typescript
// Prometheus metrics
import client from 'prom-client';

// Create metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
});

const adminLoginAttempts = new client.Counter({
  name: 'admin_login_attempts_total',
  help: 'Total number of admin login attempts',
  labelNames: ['status'],
});

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});
```

---

## Deployment Strategy

### Infrastructure

```yaml
# docker-compose.yml for admin panel
version: '3.8'

services:
  admin-frontend:
    build: ./frontend
    ports:
      - '3001:3000'
    environment:
      - NEXT_PUBLIC_API_URL=http://admin-backend:4000
    depends_on:
      - admin-backend
    restart: unless-stopped

  admin-backend:
    build: ./backend
    ports:
      - '4001:4000'
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15
    volumes:
      - admin-postgres-data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - admin-redis-data:/data
    restart: unless-stopped

volumes:
  admin-postgres-data:
  admin-redis-data:
```

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/admin.eightblock.com
server {
    listen 443 ssl http2;
    server_name admin.eightblock.com;

    ssl_certificate /etc/letsencrypt/live/admin.eightblock.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.eightblock.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=admin_login:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=admin_api:10m rate=100r/m;

    location /api/admin/auth/login {
        limit_req zone=admin_login burst=3 nodelay;
        proxy_pass http://localhost:4001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api/admin {
        limit_req zone=admin_api burst=50 nodelay;
        proxy_pass http://localhost:4001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name admin.eightblock.com;
    return 301 https://$server_name$request_uri;
}
```

### CI/CD Pipeline

```yaml
# .github/workflows/admin-deploy.yml
name: Deploy Admin Panel

on:
  push:
    branches: [main]
    paths:
      - 'admin/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd admin && npm ci
      - run: cd admin && npm run test
      - run: cd admin && npm run lint

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  deploy:
    needs: [test, security-scan]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/eightblock-admin
            git pull origin main
            docker-compose down
            docker-compose build
            docker-compose up -d
            docker-compose exec -T admin-backend npx prisma migrate deploy
```

### Backup Strategy

```bash
#!/bin/bash
# /opt/scripts/backup-admin.sh

BACKUP_DIR="/backups/admin"
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
docker-compose exec -T postgres pg_dump -U postgres admin_db | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Redis backup
docker-compose exec -T redis redis-cli --rdb /data/dump.rdb save
cp /var/lib/docker/volumes/admin-redis-data/_data/dump.rdb "$BACKUP_DIR/redis_$DATE.rdb"

# Audit logs backup
tar -czf "$BACKUP_DIR/logs_$DATE.tar.gz" /var/log/admin/

# Remove backups older than 30 days
find "$BACKUP_DIR" -type f -mtime +30 -delete

# Upload to S3 (optional)
aws s3 sync "$BACKUP_DIR" s3://eightblock-backups/admin/
```

```cron
# Crontab entry - daily at 2 AM
0 2 * * * /opt/scripts/backup-admin.sh >> /var/log/admin-backup.log 2>&1
```

---

## Next Steps

1. **Create Repository**: Set up `eightblock-admin` repository
2. **Design Review**: Review UI/UX designs with team
3. **Sprint Planning**: Break down roadmap into sprints
4. **Team Assembly**: Assign developers to features
5. **Environment Setup**: Configure development environments
6. **Begin Phase 1**: Start with foundation implementation

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [TOTP RFC 6238](https://tools.ietf.org/html/rfc6238)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

---

**Document maintained by**: EightBlock Team  
**For questions or suggestions**: Contact system administrator
