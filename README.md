# HeartWise❤️

HeartWise is an AI relationship counselor you can actually talk to. It listens, asks
clarifying questions, figures out what kind of situation you're in (wooing someone new,
going through a breakup, or untangling something complicated), and wraps up each session
with a personalized summary — insights, action items, and resources based on what you
actually talked about.

## What it does 💕

- **Talks like a counselor, not a chatbot.** The AI reflects back what you share, validates
  how you're feeling, and asks follow-up questions instead of jumping straight to generic
  advice.
- **Tracks the mode of your conversation in real time.** A badge in the chat header shows
  *Wooing them*, *Breaking up*, or *Solving complexity* — detected live by the AI as the
  conversation unfolds, with no input needed from you.
- **Stays on topic.** If you try to steer the conversation toward coding help, trivia, or
  anything unrelated to relationships, it politely declines instead of answering.
- **Summarizes the session.** Hit "End Session" and HeartWise generates a personalized
  recap: what was discussed, key insights, concrete next steps, and relevant resources —
  all tailored to your specific conversation, not generic boilerplate.
- **Feels premium.** Dark glassmorphic UI, a cursor-tracking glow that follows you across
  the whole screen, floating ambient emojis that react when your cursor gets close, and
  smooth Framer Motion micro-interactions throughout.

## Pages

| Route       | Description                                                                 |
|-------------|-------------------------------------------------------------------------------|
| `/`         | Landing page with an animated heart, theme intro, and entry points into chat |
| `/chat`     | The main conversation interface, with the live mode badge and streaming replies |
| `/summary`  | AI-generated session summary, shown after you end a conversation             |

## Tech stack❤️‍🩹

- **[Next.js](https://nextjs.org)** (App Router) — React framework and API routes
- **[React](https://react.dev)** — UI library
- **[TypeScript](https://www.typescriptlang.org/)** — type safety throughout
- **[Tailwind CSS v4](https://tailwindcss.com/)** — styling
- **[Framer Motion](https://www.framer.com/motion/)** — animations and micro-interactions
- **[Lucide React](https://lucide.dev/)** — icons
- **[OpenRouter](https://openrouter.ai/)** — LLM API gateway (the app talks to
  `openai/gpt-oss-20b:free`)

## How it works

- `app/api/chat/route.ts` — proxies chat requests to OpenRouter, streams the model's reply
  back to the browser token-by-token, screens out off-topic requests before they ever reach
  the model, and instructs the model to tag its own reply with the detected relationship
  mode.
- `lib/mode-token.ts` — parses the model's hidden `[[MODE: ...]]` tag out of the streamed
  text, strips it from what the user sees, and reports the detected mode to the UI live.
- `lib/guardrails.ts` — lightweight heuristic that flags messages unrelated to
  relationships (coding, trivia, math, etc.) so the API never has to call the model for
  those.
- `app/api/summary/route.ts` — sends the full conversation transcript to the model and asks
  for a structured JSON summary (insights, action items, resources), which the summary page
  renders.
- `lib/chat-storage.ts` — persists the conversation and detected mode in the browser's
  `localStorage`, so your conversation survives navigating between pages or refreshing.
- `components/FloatingBackground.tsx` — the cursor-tracking aura and floating emoji layer
  shared by the landing and chat pages.

## Getting started

### Prerequisites

- Node.js 18.18 or later
- An [OpenRouter](https://openrouter.ai/) API key (free tier works)

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env.local` file in the project root with your OpenRouter API key:

   ```bash
   OPENROUTER_API_KEY=your_key_here
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Other scripts

```bash
npm run build   # production build
npm run start   # run the production build
npm run lint    # lint the project
```

## Notes

- The app currently calls a free-tier model on OpenRouter (`openai/gpt-oss-20b:free`).
  OpenRouter's free tier is rate-limited and the set of available free models changes over
  time — if requests start failing, check the model list at
  [openrouter.ai/models](https://openrouter.ai/models) and update the model name in
  `app/api/chat/route.ts` and `app/api/summary/route.ts`.
- Conversation history is stored only in the browser's `localStorage` — there is no backend
  database, so clearing your browser storage (or using "Start Fresh") resets your session.

## Hope you enjoy your sessions ~HeartWise💖
