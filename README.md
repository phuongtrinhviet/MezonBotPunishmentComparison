# FineCompare Bot

A Mezon bot that visualizes how your penalty metrics compare to company averages. With a simple `*fine` command, users receive an easy-to-read chart showing their penalties versus company benchmarks.

## Features

- Visual comparison of penalty metrics using progress bars
- Percentage-based analysis of different penalty categories
- Automatic data retrieval from Timesheet API
- Smart sorting of penalty types by relevance
- Comprehensive error handling

## Local Setup

### Prerequisites

- Node.js (v20 or higher)
- Yarn or npm
- Access to Mezon Developer Portal
- Timesheet API access

### Creating a Bot on Mezon

1. Visit the Mezon Developer Portal: [https://mezon.ai/developers/applications](https://mezon.ai/developers/applications)

2. Click on "New Application or Bot" button

3. Fill in the required information

4. Copy your bot token (this will be used as your APPLICATION_TOKEN)

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/phuongtrinhviet/MezonBotPunishmentComparison.git
   cd MezonBotPunishmentComparison
   ```

2. Install dependencies:
   ```bash
   yarn
   # or
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Edit the `.env` file and add your application token and Timesheet security code:
   ```
   APPLICATION_TOKEN=your_application_token_here
   TIMESHEET_SECURITY_CODE=12345678(stg)
   ```

### Running the Bot

```bash
# Start the bot in development mode
yarn start
# or
npm run start
```

## Adding Bot to Your Clan

1. Visit the bot installation link: [https://mezon.ai/developers/bot/install/your-bot-id](https://mezon.ai/developers/bot/install/your-bot-id)

2. Select the clan where you want to add the bot

3. Authorize the bot with the required permissions

4. Once added, you can interact with the bot in any channel by typing `*fine`

## Usage

In any channel where the bot is present, type:
```
*fine
```

The bot will respond with a visual comparison of your penalty metrics versus company averages.

## Troubleshooting

- If you encounter API connection issues, verify your `TIMESHEET_SECURITY_CODE` is correct
- Make sure the bot has proper permissions in the clan
- Check the console logs for detailed error information
