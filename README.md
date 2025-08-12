# AnySearch 🔍

AnySearch lets you search across Notion, GitHub, Google Drive, and Gmail from one place. Deployed at: [anysearch.ambe.dev](https://anysearch.ambe.dev)
<img width="1280" height="640" alt="AnySearch" src="https://github.com/user-attachments/assets/6de4396f-51c1-469c-81b1-1fd60d75dee1" />


## Features

- **Unified search across multiple platforms**: instantly fetch and display search results from Notion pages, GitHub repositories, Google Drive files, and Gmail.

- **AI-Enhanced Search**: optional intelligent query generation using schema awareness and user context.

- **Minimal UI**: one search bar, integrations panel, and neatly displayed result cards.

- **OAuth with PKCE**: authentication uses the PKCE (Proof Key for Code Exchange) flow to securely connect to each platform.

## Tech Stack

- **Frontend:** Tanstack Start, React, TypeScript
- **Styling/UI:** Tailwind CSS, Radix UI Themes
- **Authorization:** OAuth with PKCE
- **AI Integration:** Vercel AI SDK (Google Gemini model)

## Run Locally

1. Clone the repo:

   ```bash
   git clone https://github.com/ammarmbe/anysearch.git
   cd anysearch
   ```

2. Create an `.env` file and fill it with your API keys

3. Install dependencies and run locally:

   ```bash
   npm install
   npm run dev
   ```

4. Launch the app, connect your accounts, and start searching.
