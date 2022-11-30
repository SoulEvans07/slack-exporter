import dotenv from 'dotenv';

dotenv.config();

export const config = {
  slack: {
    oauthToken: process.env.SLACK_USER_OAUTH_TOKEN!,
    userEmail: process.env.SLACK_USER_EMAIL!,
  },
};
