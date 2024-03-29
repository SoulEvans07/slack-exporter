import dotenv from 'dotenv';

dotenv.config();

// TODO: use zod
export const config = {
  slack: {
    oauthToken: process.env.SLACK_USER_OAUTH_TOKEN!,
    userEmail: process.env.SLACK_USER_EMAIL!,
  },
  output: process.env.OUTPUT_FOLDER!,
};
