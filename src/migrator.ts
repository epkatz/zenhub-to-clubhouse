import { Octokit } from "@octokit/rest";
import Clubhouse from "clubhouse-lib";
import moment from "moment";
import ZenHub from "node-zenhub";

export const migrateIssuesForRepo = async ({
  state = "open",
  per_page = 10,
}) => {
  const octokit = new Octokit({
    auth: process.env.GITHUB_ACCESS_TOKEN,
  });
  const clubhouseApi = Clubhouse.create(process.env.CLUBHOUSE_TOKEN);
  const zenhubApi = new ZenHub(process.env.ZENHUB_TOKEN);

  const options = octokit.issues.listForRepo.endpoint.merge({
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
    state,
    per_page,
  });

  const issues: any = await octokit
    .paginate(options)
    .then((data) => {
      const issues = data.filter(({ pull_request }) => !pull_request);
      return issues;
    })
    .catch((err) => {
      console.log(err);
    });

  const stories = await clubhouseApi.listStories(
    parseInt(process.env["PROJECT_ID"], 10)
  );

  const storiesSet = new Set();
  stories.map((s) => {
    storiesSet.add(s.name);
  });

  await Promise.all(
    issues.map(async (issue) =>
      createIndividualCard({
        octokit,
        zenhubApi,
        clubhouseApi,
        issue,
        storiesSet,
      })
    )
  );
};

const createIndividualCard = async ({
  octokit,
  zenhubApi,
  clubhouseApi,
  issue,
  storiesSet,
}) => {
  const commentsResponse = await octokit.issues.listComments({
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
    issue_number: issue.number,
  });

  const issueData: any = await issueDataPromise(
    zenhubApi,
    process.env.ZENHUB_REPO_ID,
    issue.number
  );
  const isEpic = issueData.is_epic;
  const pipelineName = issueData.pipeline && issueData.pipeline.name || null;
  const workflowStateId = pipelineName
    ? getWorkflowStateId(pipelineName)
    : null;

  if (storiesSet.has(issue.title)) {
    console.log(`Issue "${issue.title}" already created`);
    return;
  } else {
    console.log(`***Creating issue "${issue.title}"***`);
  }

  try {
    if (!isEpic) {
      await createStory({
        clubhouseApi,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        labels: issue.labels,
        title: issue.title,
        body: issue.body,
        comments: commentsResponse.data,
        workflow_state_id: workflowStateId,
      });
    } else {
      if (process.env["RUN_TYPE"] !== "redo") {
        await createEpic({
          clubhouseApi,
          created_at: issue.created_at,
          updated_at: issue.updated_at,
          title: issue.title,
          body: issue.body,
        });
      }
    }
  } catch (err) {
    console.error(err);
  }
};

const issueDataPromise = (zenhubApi, ...args) => {
  return new Promise((resolve, reject) => {
    zenhubApi.issues.getIssueData(...args, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
};

const createStory = async ({
  clubhouseApi,
  created_at,
  updated_at,
  labels,
  title,
  body,
  comments,
  workflow_state_id,
}) => {
  const { id } = await clubhouseApi.createStory({
    created_at,
    updated_at,
    story_type: getStoryType(labels),
    name: title,
    description: body,
    project_id: parseInt(process.env["PROJECT_ID"], 10),
    labels: getLabels(labels),
    workflow_state_id,
  });

  for (const comment of comments) {
    await clubhouseApi.createStoryComment(
      id,
      `*Migrated From Zenhub* \n\n${comment.user.login} on ${moment(
        comment.created_at
      ).format("MMMM Do YYYY, h:mm:ss a")} \n${comment.body}`
    );
  }
};

const getWorkflowStateId = (pipeline) => {
  try {
    const clubhouseWorkflowState =
      ZENHUB_TO_CLUBHOUSE_WORKFLOW_MAPPING[pipeline];
    const clubhouseWorkflowId =
      CLUBHOUSE_WORKFLOW_STATE[clubhouseWorkflowState];
    return clubhouseWorkflowId;
  } catch (err) {
    console.error(err);
  }
  return null;
};

const getLabels = (labels) =>
  labels.map(({ name, color, description }) => ({
    color: `#${color}`,
    description,
    external_id: name,
    name,
  }));

const getStoryType = (labels) => {
  if (labels.find(({ name }) => name.includes("bug"))) {
    return "bug";
  }
  return "feature";
};

const createEpic = async ({
  clubhouseApi,
  created_at,
  updated_at,
  title,
  body,
}) => {
  await clubhouseApi.createEpic({
    created_at,
    updated_at,
    name: title,
    description: body,
  });
};

const CLUBHOUSE_WORKFLOW_STATE = {
  Backlog: 500000028,
  Inbox: 500000008,
  Planning: 500000027,
  Ready: 500000007,
  "In Progress": 500000006,
  "Ready for QA/Review": 500000026,
  "To Deploy": 500000009,
  Done: 500000011,
};

const ZENHUB_TO_CLUBHOUSE_WORKFLOW_MAPPING = {
  "Upcoming Sprint Backlog": "Planning",
  "To Do": "Planning",
  "Pit Of Despair": "Backlog",
  Epics: "Backlog",
  "Ready To Go": "Ready",
  "In Progress": "In Progress",
  Blocked: "In Progress",
  "Ready for QA/Review": "Ready for QA/Review",
  "QA Passed/Under PR": "To Deploy",
  Closed: "Done",
};
