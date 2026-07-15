// ============================================================================
// DOMAIN TYPES — All types for fitcoach app
// ============================================================================

// ============================================================================
// Enums as Literal Types
// ============================================================================

export type FitnessGoal = '체중감량' | '근력증가' | '자세교정';
export type FitnessLevel = '초급' | '중급' | '상급';
export type WorkoutId = 'squat' | 'pushup' | 'plank';
export type SessionId = string;
export type ReportId = string;

// ============================================================================
// User Profile
// ============================================================================

export interface UserProfile {
  version: 1;
  id: 'me';
  heightCm: number;
  weightKg: number;
  goal: FitnessGoal;
  level: FitnessLevel;
  voiceFeedbackEnabled: boolean;
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// AI Disclosure State
// ============================================================================

export interface AiDisclosureState {
  version: 1;
  id: 'me';
  acknowledged: boolean;
  acknowledgedAt?: number;
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// Premium State
// ============================================================================

export interface PremiumState {
  version: 1;
  id: 'me';
  isPremium: boolean;
  expiresAt?: number;
  lastPurchaseAt?: number;
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// Workout Definition
// ============================================================================

export interface WorkoutDefinition {
  id: WorkoutId;
  title: string;
  description: string;
  targetMinutes: number;
  premiumOnly: boolean;
}

// ============================================================================
// Pose Feedback Event
// ============================================================================

export interface PoseFeedbackEvent {
  t: number;
  code: 'KNEE_MORE_BEND' | 'BACK_STRAIGHT' | 'ELBOWS_IN';
  messageKo: string;
  severity: 1 | 2 | 3;
}

// ============================================================================
// Session Record (localStorage model)
// ============================================================================

export interface SessionRecord {
  version: 1;
  sessionId: string;
  id: string;
  workoutId: WorkoutId;
  startedAt: number;
  endedAt?: number;
  durationSec?: number;
  feedbackCount: number;
  feedbackEventsSample: PoseFeedbackEvent[];
  score?: number;
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// Promotion State
// ============================================================================

export interface PromotionState {
  version: 1;
  id: 'me';
  firstSessionRewardGranted: boolean;
  grantedAt?: number;
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// Session (Entity Schema)
// ============================================================================

export interface Session {
  version: 1;
  id: SessionId;
  workoutId: WorkoutId;
  startedAt: number;
  endedAt?: number;
  durationSec?: number;
  feedbackCount: number;
  feedbackEventsSample: PoseFeedbackEvent[];
  score?: number;
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// Workout Session (Runtime Schema)
// ============================================================================

export interface WorkoutSession {
  version: 1;
  id: string;
  workoutId: WorkoutId;
  status: 'READY' | 'RUNNING' | 'ENDED';
  lastFeedback?: PoseFeedbackEvent;
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// Report (AI Result Entity)
// ============================================================================

export interface Report {
  version: 1;
  id: ReportId;
  sessionId: SessionId;
  generatedBy: 'AI';
  language: 'ko-KR';
  score: number;
  summaryKo: string;
  improvementsKo: string[];
  recommendationsKo: string[];
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// Pagination Types
// ============================================================================

export interface PageRequest {
  page: number;
  pageSize: number;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateSessionRequest {
  workoutId: WorkoutId;
  startedAt: number;
  profile?: {
    heightCm: number;
    weightKg: number;
    goal: FitnessGoal;
    level: FitnessLevel;
  };
}

export interface CreateSessionResponse {
  session: Session;
}

export interface SubmitFeedbackRequest {
  t: number;
  pose: {
    landmarks: Array<{ x: number; y: number; score?: number }>;
  };
}

export interface SubmitFeedbackResponse {
  feedback?: PoseFeedbackEvent;
}

export interface GenerateReportRequest {
  sessionId: SessionId;
  workoutId: WorkoutId;
  startedAt: number;
  endedAt: number;
  durationSec: number;
  feedbackEventsSample: PoseFeedbackEvent[];
  profile?: {
    heightCm: number;
    weightKg: number;
    goal: FitnessGoal;
    level: FitnessLevel;
  };
}

export interface GenerateReportResponse {
  report: Report;
}

// ============================================================================
// API Error Response
// ============================================================================

export interface ApiError {
  error: {
    code:
      | 'BAD_REQUEST'
      | 'UNAUTHORIZED'
      | 'NOT_FOUND'
      | 'RATE_LIMITED'
      | 'INTERNAL';
    message: string;
  };
}

// ============================================================================
// Route State (Navigation)
// ============================================================================

export type RouteState = {
  workoutId?: string;
  sessionId?: string;
  from?: 'home' | 'premium' | 'report';
  toast?: 'saved' | 'premium';
};
