import Anthropic from "@anthropic-ai/sdk";

// Server-only: import this from server actions / route handlers, never from client components.
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
