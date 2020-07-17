# For migrating Zenhub to Clubhouse

## Instructions

Make a copy of the `.env.example` file

Replace the dummy values with your own.

```text
CLUBHOUSE_TOKEN - In Clubhouse, settings/account/api-tokens
GITHUB_ACCESS_TOKEN - https://github.com/settings/tokens with full repo permissions
GITHUB_OWNER - The name of your orginization in github
GITHUB_REPO - The name of the repo
PROJECT_ID - The project id in Clubhouse which will be in the URL of the Project page
ZENHUB_TOKEN - Generate a new token in Zenhub https://app.zenhub.com/dashboard/tokens
```

Run `yarn start`
