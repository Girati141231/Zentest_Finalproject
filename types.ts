export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';
export type Status = 'Passed' | 'Failed' | 'Pending';

export interface Project {
  id: string;
  name: string;
  color: string;
  initial: string;
  owner?: string;
  photoURL?: string;
  role?: ProjectRole; // Role of the current user in this project
}

export type ProjectRole = 'owner' | 'editor' | 'viewer';

export interface ProjectMember {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: ProjectRole;
  joinedAt: number;
}

export interface Module {
  id: string;
  projectId: string;
  name: string;
}

export interface TestCase {
  id: string;
  projectId: string;
  title: string;
  module: string;
  priority: Priority;
  status: Status;
  steps: string[];
  expected: string;
  script: string;
  hasAutomation: boolean;
  automationSteps?: any[];
  lastUpdatedBy?: string;
  lastUpdatedByName?: string;
  lastUpdatedByPhoto?: string;
  timestamp?: number;
  round?: number;
  commentCount?: number;
}

export interface APITestCase {
  id: string;
  projectId: string;
  title: string;
  module: string;
  priority: Priority;
  status: Status;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: { key: string; value: string }[];
  body?: string;
  expectedStatus: number;
  expectedBody?: string;
  lastUpdatedBy?: string;
  lastUpdatedByName?: string;
  lastUpdatedByPhoto?: string;
  timestamp?: number;
  round?: number;
  commentCount?: number;
}

export interface LogEntry {
  msg: string;
  type: 'info' | 'success' | 'error';
}

export interface Comment {
  id: string;
  testCaseId: string;
  projectId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  content: string;
  timestamp: number;
}

export type ModalMode = 'create' | 'edit' | 'join' | null;

export const PRIORITIES: Priority[] = ['Critical', 'High', 'Medium', 'Low'];
export const STATUSES: Status[] = ['Passed', 'Failed', 'Pending'];
export const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#a855f7', '#6366f1'];

export interface LicenseKey {
  key: string;
  durationDays: number;
  isUsed: boolean;
  usedBy?: string;
  usedByName?: string;
  usedByEmail?: string;
  usedAt?: number;
  createdAt: number;
}

export interface User {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  tier?: 'free' | 'pro';
  validUntil?: any;
}
