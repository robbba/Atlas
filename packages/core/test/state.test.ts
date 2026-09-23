import assert from 'node:assert/strict';
import test from 'node:test';
import { AtlasStateError, createInitialState, reduceState } from '../src/index.ts';

test('reduces immutable employee, activity, and shift state', () => {
  const initial = createInitialState();
  const withEmployee = reduceState(initial, {
    type: 'employee.upsert',
    employee: { id: 'emp-1', name: 'Ada Lovelace', role: 'Planner' },
  });
  const withActivity = reduceState(withEmployee, {
    type: 'activity.upsert',
    activity: {
      id: 'act-1',
      name: 'Morning allocation',
      startAt: '2026-09-22T08:00:00.000Z',
      endAt: '2026-09-22T12:00:00.000Z',
    },
  });
  const withShift = reduceState(withActivity, {
    type: 'shift.upsert',
    shift: {
      id: 'shift-1',
      employeeId: 'emp-1',
      activityId: 'act-1',
      startAt: '2026-09-22T08:00:00.000Z',
      endAt: '2026-09-22T12:00:00.000Z',
    },
  });

  assert.deepEqual(initial, createInitialState());
  assert.equal(withShift.shifts['shift-1']?.employeeId, 'emp-1');
  assert.notEqual(withShift, withActivity);
});

test('rejects invalid shift references and time ranges', () => {
  const state = createInitialState();
  assert.throws(
    () => reduceState(state, {
      type: 'shift.upsert',
      shift: {
        id: 'shift-1',
        employeeId: 'missing',
        activityId: 'missing',
        startAt: '2026-09-22T12:00:00.000Z',
        endAt: '2026-09-22T08:00:00.000Z',
      },
    }),
    AtlasStateError,
  );
});

test('rejects overlapping shifts for one employee', () => {
  let state = createInitialState();
  state = reduceState(state, {
    type: 'employee.upsert',
    employee: { id: 'emp-1', name: 'Ada', role: 'Planner' },
  });
  state = reduceState(state, {
    type: 'activity.upsert',
    activity: {
      id: 'act-1', name: 'Operation',
      startAt: '2026-09-22T08:00:00.000Z', endAt: '2026-09-22T16:00:00.000Z',
    },
  });
  state = reduceState(state, {
    type: 'shift.upsert',
    shift: {
      id: 'shift-1', employeeId: 'emp-1', activityId: 'act-1',
      startAt: '2026-09-22T08:00:00.000Z', endAt: '2026-09-22T12:00:00.000Z',
    },
  });
  assert.throws(() => reduceState(state, {
    type: 'shift.upsert',
    shift: {
      id: 'shift-2', employeeId: 'emp-1', activityId: 'act-1',
      startAt: '2026-09-22T11:00:00.000Z', endAt: '2026-09-22T14:00:00.000Z',
    },
  }), AtlasStateError);
});
