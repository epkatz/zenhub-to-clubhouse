import { Octokit } from "@octokit/rest";
import { UniversalIssue } from "./types/UniversalIssue";

const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN,
});

export const getIssuesForRepo = async ({
  state,
  per_page = 100,
  page = 1,
}): Promise<Array<UniversalIssue>> => {
  const issues = await octokit.issues.listForRepo({
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
    state,
    per_page,
    page,
  });

  const universalIssues = issues.data
    .filter((issue) => !issue.pull_request)
    .map(
      ({
        created_at,
        labels,
        title,
        body,
        user: { login: username },
        state,
        closed_at,
        assignee,
        html_url,
      }) => ({
        createdAt: new Date(created_at),
        labels: labels.map(({ name }) => name),
        name: title,
        description: body,
        requestedBy: username,
        state,
        closedAt: closed_at ? new Date(closed_at) : null,
        owner: assignee ? assignee.login : null,
        externalId: html_url,
      })
    );

  return universalIssues;
};
