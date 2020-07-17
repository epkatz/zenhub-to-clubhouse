# For migrating Zenhub to Clubhouse

This repo will help you migrate your Zenhub issues to Clubhouse. It migrates stories and epics.
It will add comments to the stories but not epics.

ToDo:

- Add stories to epics
- Add owner to stories
- Add estimates
- Add states to epics

## Instructions

### ENV

Make an `.env` by copying the `.env.example` file name

Replace the dummy values with your own.

```text
CLUBHOUSE_TOKEN - In Clubhouse, settings/account/api-tokens
GITHUB_ACCESS_TOKEN - https://github.com/settings/tokens with full repo permissions
GITHUB_OWNER - The name of your orginization in github
GITHUB_REPO - The name of the repo
PROJECT_ID - The project id in Clubhouse which will be in the URL of the Project page
ZENHUB_TOKEN - Generate a new token in Zenhub https://app.zenhub.com/dashboard/tokens
ZENHUB_REPO_ID - You can get this from the Zenhub url parameter (e.g. with `.../board?repos=12345678` use the 12345678)
```

### Workflow States

You'll need to update the Workflow States to your own mappings to get this to work

The `CLUBHOUSE_WORKFLOW_STATE` mapping should be the Clubhouse Workflow name to the Id. You can find the IDs in the Clubhouse UI or use their API to get all of your IDs

The `ZENHUB_TO_CLUBHOUSE_WORKFLOW_MAPPING` is a mapping of your Zenhub Pipeline names to the Clubhouse workflow states.

If you don't set this, it defaults to the default workflow state

### Running

Run `yarn start`
