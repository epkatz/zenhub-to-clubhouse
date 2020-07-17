import { Octokit } from "@octokit/rest";
import Clubhouse from "clubhouse-lib";
import moment from "moment";
import ZenHub from "node-zenhub";

const getLabels = (labels) =>
  labels.map(({ name, color, description }) => ({
    color,
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

const createStory = async ({
  clubhouseApi,
  created_at,
  updated_at,
  labels,
  title,
  body,
  comments,
  workflow_state_id,
  estimate,
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
    estimate,
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

  const firstIssue: any = issues.filter((issue) => issue.comments > 0)[0];

  const commentsResponse = await octokit.issues.listComments({
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
    issue_number: firstIssue.number,
  });

  var cb = function (error, data) {
    console.log(error);
    console.log(data);
}

  // const issue = zenhubApi.issues.getIssue(firstIssue.number);
  console.log(zenhubApi.issues.getIssueData(273086464, firstIssue.number, cb));

  // estimate.value
  // is_epic
  // pipeline.name

  //   await createStory({
  //     clubhouseApi,
  //     created_at: firstIssue.created_at,
  //     updated_at: firstIssue.updated_at,
  //     labels: firstIssue.labels,
  //     title: firstIssue.title,
  //     body: firstIssue.body,
  //     comments: commentsResponse.data,
  //      workflow_state_id,
  //   });
  // };
};
