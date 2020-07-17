import Clubhouse, { Label, Member, ID } from "clubhouse-lib";
import { UniversalIssue } from "./types/UniversalIssue";

const clubhouseApi = Clubhouse.create(process.env.CLUBHOUSE_TOKEN);

let labelMapping: Record<string, Label>;
let memberMapping: Record<string, ID>;

export const initializeMappings = async () => {
  if (labelMapping === undefined) {
    initializeLabelMapping();
  }
  if (labelMapping === undefined) {
    initializeMemberMapping();
  }
};

export const createStory = async (issue: UniversalIssue) => {
  let labels: Array<Label> = [];
  if (issue.labels) {
    labels = await Promise.all(issue.labels.map(getOrCreateLabel));
  }

  clubhouseApi.createStory({
    created_at: issue.createdAt.toISOString(),
    deadline: issue.deadline.toISOString(),
    description: issue.description,
    epic_id: issue.epicId,
    estimate: issue.estimate,
    labels,
    name: issue.name,
    owner_ids: [
      memberMapping[issue.owner] || process.env["CLUBHOUSE_OWNER_DEFAULT"],
    ],
    project_id: parseInt(process.env["PROJECT_ID"], 10),
    requested_by_id: memberMapping[issue.requestedBy] || process.env["CLUBHOUSE_OWNER_DEFAULT"],
    story_type: issue.storyType,
  });
};

const getOrCreateLabel = async (name: string): Promise<Label> => {
  if (!labelMapping[name]) {
    const label = await createLabel({ name });
    labelMapping[name] = label;
  }
  return labelMapping[name];
};

const initializeLabelMapping = async () => {
  labelMapping = {};
  const labels = await clubhouseApi.listLabels();
  labels.forEach((label) => (labelMapping[label.name] = label));
};

const initializeMemberMapping = async () => {
  memberMapping = {};
  const members = await clubhouseApi.listMembers();
  members.forEach((member) => (memberMapping[member.profile.name] = member.id));
};

const createLabel = async ({
  name,
  color = "#a8d5cc",
}: {
  name: string;
  color?: string;
}): Promise<Label> => clubhouseApi.createLabel(name, color);
