import dotenv from 'dotenv';

dotenv.config();

export const config = {
  slackUserOAuthToken: process.env.SLACK_USER_OAUTH_TOKEN,
};
