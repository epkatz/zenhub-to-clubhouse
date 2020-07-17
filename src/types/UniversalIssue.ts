const BUG = 'bug';
const CHORE = 'chore';
const FEATURE = 'feature';

export type UniversalIssue = {
  closedAt?: Date;
  createdAt: Date;
  deadline?: Date;
  description?: string;
  epicId?: number;
  estimate?: number;
  externalId: string;
  labels?: Array<string>;
  name: string;
  owner: string;
  requestedBy: string;
  state: string;
  storyType?: 'bug' | 'chore' | 'feature';
}