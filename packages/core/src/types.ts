export type UserId = string;
export type EmployeeId = string;
export type ActivityId = string;
export type ShiftId = string;

export type UserRole = 'admin' | 'planner' | 'viewer';
export type EmployeeRole = string;

/** ISO 8601 timestamp in UTC, for example `2026-09-22T08:00:00.000Z`. */
export type IsoUtcTimestamp = string;

export interface User {
  readonly id: UserId;
  readonly externalId: string | null;
  readonly name: string;
  readonly role: UserRole;
}

export interface Employee {
  readonly id: EmployeeId;
  readonly name: string;
  readonly role: EmployeeRole;
}

export interface Activity {
  readonly id: ActivityId;
  readonly name: string;
  readonly startAt: IsoUtcTimestamp;
  readonly endAt: IsoUtcTimestamp;
}

export interface Shift {
  readonly id: ShiftId;
  readonly employeeId: EmployeeId;
  readonly activityId: ActivityId;
  readonly startAt: IsoUtcTimestamp;
  readonly endAt: IsoUtcTimestamp;
}

export interface AtlasState {
  readonly users: Readonly<Record<UserId, User>>;
  readonly employees: Readonly<Record<EmployeeId, Employee>>;
  readonly activities: Readonly<Record<ActivityId, Activity>>;
  readonly shifts: Readonly<Record<ShiftId, Shift>>;
}

export type AtlasAction =
  | { readonly type: 'user.upsert'; readonly user: User }
  | { readonly type: 'user.remove'; readonly userId: UserId }
  | { readonly type: 'employee.upsert'; readonly employee: Employee }
  | { readonly type: 'employee.remove'; readonly employeeId: EmployeeId }
  | { readonly type: 'activity.upsert'; readonly activity: Activity }
  | { readonly type: 'activity.remove'; readonly activityId: ActivityId }
  | { readonly type: 'shift.upsert'; readonly shift: Shift }
  | { readonly type: 'shift.remove'; readonly shiftId: ShiftId };
