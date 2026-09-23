import type {
  Activity,
  ActivityId,
  AtlasAction,
  AtlasState,
  Employee,
  EmployeeId,
  IsoUtcTimestamp,
  Shift,
  User,
  UserId,
} from './types.js';

export class AtlasStateError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'AtlasStateError';
  }
}

export function createInitialState(): AtlasState {
  return {
    users: {},
    employees: {},
    activities: {},
    shifts: {},
  };
}

export function reduceState(state: AtlasState, action: AtlasAction): AtlasState {
  switch (action.type) {
    case 'user.upsert':
      assertUser(action.user);
      return { ...state, users: { ...state.users, [action.user.id]: action.user } };
    case 'user.remove':
      return removeUser(state, action.userId);
    case 'employee.upsert':
      assertEmployee(action.employee);
      return { ...state, employees: { ...state.employees, [action.employee.id]: action.employee } };
    case 'employee.remove':
      return removeEmployee(state, action.employeeId);
    case 'activity.upsert':
      assertActivity(action.activity);
      return { ...state, activities: { ...state.activities, [action.activity.id]: action.activity } };
    case 'activity.remove':
      return removeActivity(state, action.activityId);
    case 'shift.upsert':
      assertShift(state, action.shift);
      return { ...state, shifts: { ...state.shifts, [action.shift.id]: action.shift } };
    case 'shift.remove':
      return removeShift(state, action.shiftId);
  }
}

function removeUser(state: AtlasState, userId: UserId): AtlasState {
  if (!(userId in state.users)) return state;
  const { [userId]: _removed, ...users } = state.users;
  return { ...state, users };
}

function removeEmployee(state: AtlasState, employeeId: EmployeeId): AtlasState {
  if (!(employeeId in state.employees)) return state;
  if (Object.values(state.shifts).some((shift) => shift.employeeId === employeeId)) {
    throw new AtlasStateError(`Cannot remove employee "${employeeId}" while shifts reference it.`);
  }
  const { [employeeId]: _removed, ...employees } = state.employees;
  return { ...state, employees };
}

function removeActivity(state: AtlasState, activityId: ActivityId): AtlasState {
  if (!(activityId in state.activities)) return state;
  if (Object.values(state.shifts).some((shift) => shift.activityId === activityId)) {
    throw new AtlasStateError(`Cannot remove activity "${activityId}" while shifts reference it.`);
  }
  const { [activityId]: _removed, ...activities } = state.activities;
  return { ...state, activities };
}

function removeShift(state: AtlasState, shiftId: string): AtlasState {
  if (!(shiftId in state.shifts)) return state;
  const { [shiftId]: _removed, ...shifts } = state.shifts;
  return { ...state, shifts };
}

function assertUser(user: User): void {
  assertId(user.id, 'User');
  assertRequiredText(user.name, 'User name');
  if (!['admin', 'planner', 'viewer'].includes(user.role)) {
    throw new AtlasStateError(`Unsupported user role "${user.role}".`);
  }
}

function assertEmployee(employee: Employee): void {
  assertId(employee.id, 'Employee');
  assertRequiredText(employee.name, 'Employee name');
  assertRequiredText(employee.role, 'Employee role');
}

function assertActivity(activity: Activity): void {
  assertId(activity.id, 'Activity');
  assertRequiredText(activity.name, 'Activity name');
  assertTimeRange(activity.startAt, activity.endAt, `Activity "${activity.id}"`);
}

function assertShift(state: AtlasState, shift: Shift): void {
  assertId(shift.id, 'Shift');
  if (!(shift.employeeId in state.employees)) {
    throw new AtlasStateError(`Shift "${shift.id}" references unknown employee "${shift.employeeId}".`);
  }
  if (!(shift.activityId in state.activities)) {
    throw new AtlasStateError(`Shift "${shift.id}" references unknown activity "${shift.activityId}".`);
  }
  assertTimeRange(shift.startAt, shift.endAt, `Shift "${shift.id}"`);
  const activity = state.activities[shift.activityId];
  if (activity !== undefined && (
    Date.parse(shift.startAt) < Date.parse(activity.startAt)
    || Date.parse(shift.endAt) > Date.parse(activity.endAt)
  )) {
    throw new AtlasStateError(`Shift "${shift.id}" must be within its activity time range.`);
  }
  const overlaps = Object.values(state.shifts).some((existing) => (
    existing.id !== shift.id
    && existing.employeeId === shift.employeeId
    && Date.parse(existing.startAt) < Date.parse(shift.endAt)
    && Date.parse(shift.startAt) < Date.parse(existing.endAt)
  ));
  if (overlaps) {
    throw new AtlasStateError(`Employee "${shift.employeeId}" already has an overlapping shift.`);
  }
}

function assertId(value: string, label: string): void {
  assertRequiredText(value, `${label} id`);
}

function assertRequiredText(value: string, label: string): void {
  if (value.trim().length === 0) throw new AtlasStateError(`${label} is required.`);
}

function assertTimeRange(startAt: IsoUtcTimestamp, endAt: IsoUtcTimestamp, label: string): void {
  const start = Date.parse(startAt);
  const end = Date.parse(endAt);
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    throw new AtlasStateError(`${label} must use valid ISO-8601 timestamps.`);
  }
  if (start >= end) throw new AtlasStateError(`${label} must end after it starts.`);
}
