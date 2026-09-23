import { normalizeLegacyPlannerDocument, type PlannerDocument, type RevisionedPlannerDocument } from '@atlas/core';

export interface PlannerApi {
  load(): Promise<RevisionedPlannerDocument>;
  save(document: PlannerDocument, revision: number): Promise<RevisionedPlannerDocument>;
  dryRunImport(document: unknown): Promise<{ valid: boolean; document?: PlannerDocument; warnings?: readonly string[]; error?: string }>;
}

export function createPlannerApi(): PlannerApi {
  return {
    async load() {
      const response = await fetch('/api/planner');
      if (!response.ok) throw new Error(`Could not load planner (${response.status}).`);
      return response.json() as Promise<RevisionedPlannerDocument>;
    },
    async save(document, revision) {
      const response = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ document, expectedRevision: revision }),
      });
      if (response.status === 409) throw new Error('CONFLICT');
      if (!response.ok) throw new Error(`Could not save planner (${response.status}).`);
      return response.json() as Promise<RevisionedPlannerDocument>;
    },
    async dryRunImport(document) {
      const response = await fetch('/api/planner/import/legacy/dry-run', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ document: normalizeLegacyPlannerDocument(document) }),
      });
      return response.json() as Promise<{ valid: boolean; document?: PlannerDocument; warnings?: readonly string[]; error?: string }>;
    },
  };
}
