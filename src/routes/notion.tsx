import { createServerFileRoute } from "@tanstack/react-start/server";

export const ServerRoute = createServerFileRoute("/notion").methods({
  POST: async ({ request }) => {
    const body = await request.json();

    const { accessToken, ...queryParameters } = body;

    const response = await fetch("https://api.notion.com/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(queryParameters),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      statusText: response.statusText,
      headers: {
        "Content-Type": "application/json",
      },
    });
  },
});
