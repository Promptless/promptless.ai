/**
 * Automated edu campaign script for Promptless blog.
 *
 * Flow:
 *  1. Pick a random keyword from keywords.txt
 *  2. Run a Claude agent (with web search) to research the topic
 *  3. Write a high-quality MDX article in Promptless's voice
 *  4. Commit to a new branch and open a GitHub PR
 *  5. Post the PR link to Slack
 *
 * Required env vars:
 *   ANTHROPIC_API_KEY      — Anthropic API key
 *   SLACK_WEBHOOK_URL      — Slack incoming webhook URL
 *
 * Usage:
 *   npx tsx scripts/edu_campaign/generate-article.ts
 */

import Anthropic from "@anthropic-ai/sdk";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");

// ─── helpers ──────────────────────────────────────────────────────────────────

function pickKeyword(): string {
  const keywordsPath = path.join(__dirname, "keywords.txt");
  const keywords = fs
    .readFileSync(keywordsPath, "utf-8")
    .split("\n")
    .map((k) => k.trim())
    .filter((k) => k && !k.startsWith("#"));
  if (!keywords.length) throw new Error("keywords.txt is empty");
  return keywords[Math.floor(Math.random() * keywords.length)];
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function monthYear(): string {
  return new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
}

function exec(cmd: string, opts: { cwd?: string } = {}): string {
  return execSync(cmd, { cwd: opts.cwd ?? REPO_ROOT, encoding: "utf-8" }).trim();
}

// ─── research + write ─────────────────────────────────────────────────────────

async function generateArticle(keyword: string): Promise<string> {
  const client = new Anthropic();

  const systemPrompt = `You are a content generation agent for Promptless, an AI-powered documentation platform that helps developer-facing companies keep their docs accurate and up to date. Promptless's audience is technical writers, DevRel engineers, developer advocates, solutions engineers, and engineering managers at software companies.

Writing style:
- 10th grade reading level: short sentences, plain words, no jargon without explanation
- Direct and dry, like a Dutch engineer. Say what you mean. Cut anything that doesn't add information. No filler, no fluff.
- Grounded in concrete examples, real numbers, and cited evidence
- Do NOT use em dashes
- Do NOT use tricolon structures (three-item lists used for rhetorical effect, e.g. "It's fast, reliable, and cheap")
- Do NOT use "X is not Y, but Z" constructions (e.g. "This isn't a tooling problem, it's a process problem")

Structural conventions:
- Use ## for H2 sections, ### for H3
- Aim for 800–1400 words
- Lead with a hook that frames the specific problem — NOT a generic intro paragraph
- Do NOT include a generic conclusion that restates what was said
- Place <BlogNewsletterCTA /> at roughly the 40–50% mark (after the first major section)
- End the article with <BlogRequestDemo />

MDX frontmatter format (fill in all fields):
---
title: 'Article Title Here'
subtitle: Published ${monthYear()}
description: >-
  One or two sentence SEO description, 120–160 characters.
date: '${todayISO()}T00:00:00.000Z'
author: Frances
section: Use Cases
hidden: false
---
import BlogNewsletterCTA from '@components/site/BlogNewsletterCTA.astro';
import BlogRequestDemo from '@components/site/BlogRequestDemo.astro';

[article body starts here]`;

  const userPrompt = `You are a scheduled content generation agent for Promptless, an AI-powered documentation platform that helps developer-facing companies keep their docs accurate and up to date. Promptless's audience is technical writers, DevRel engineers, developer advocates, solutions engineers, and engineering managers at companies with developer-facing products.

**Step 1 — Keyword**
The keyword for this article is: \`${keyword}\`

**Step 2 — Research**
Use web search to find the top articles, blog posts, studies, and discussions on this keyword. Read a sample of 5–8 of the best results thoroughly. Identify: the main angles already covered, data points or case studies cited, gaps in existing coverage, and what practitioners are actually struggling with. Look especially for 2024–2026 material.

**Step 3 — Write a plan**
Before writing anything, produce a detailed article plan. The plan must answer:
- **Article format:** What format best serves this content and reader? Describe it in your own words — e.g. "a comparison of two approaches to help readers make a technical decision," or "an explainer that teaches readers why X matters before showing them what to do about it." Don't force it into a category.
- **Thesis:** What is the single main point this article makes? State it in one sentence.
- **Target reader:** Who specifically benefits from this — developers, technical writers, solutions engineers, product managers, developer advocates? What do they already know, and what gap does this fill?
- **Key points:** List the 4–6 specific claims or arguments the article will make, in order. Each point should be concrete — not "discuss X" but "argue that X causes Y because Z".
- **Evidence:** For each key point, note what data, case studies, or examples you found in Step 2 that support it. Add links to the evidence.
- **Promptless connection:** Explicitly state how the article's thesis connects to what Promptless does. This does not need to be a sales pitch — it should be a logical continuation. E.g. "This article argues that docs go stale faster than teams notice, which is exactly the problem Promptless monitors for."

Write the plan as a structured document. Do not proceed to writing the article until the plan is complete.

**Step 4 — Write the article**
Write a complete, publication-ready MDX blog post strictly according to the plan from Step 3:
- 800–1400 words
- 10th grade reading level — short sentences, plain words, no jargon without explanation
- Style: direct and dry, like a Dutch engineer. Say what you mean. Cut anything that doesn't add information. No enthusiasm, no hype.
- Lead with a hook that frames the specific problem (NOT a generic intro paragraph)
- Use ## for H2, ### for H3
- Place \`<BlogNewsletterCTA />\` at the 40–50% mark (after the first major section)
- End with \`<BlogRequestDemo />\`
- Do NOT include a generic conclusion that restates what was said
- Ground every claim in concrete examples, real numbers, or cited evidence from your research

Frontmatter format (fill in all fields, today's date):
\`\`\`
---
title: 'Article Title Here'
subtitle: Published [Month Year]
description: >-
  One or two sentence SEO description, 120–160 characters.
date: '[YYYY-MM-DD]T00:00:00.000Z'
author: Frances
section: Use Cases
hidden: false
---
import BlogNewsletterCTA from '@components/site/BlogNewsletterCTA.astro';
import BlogRequestDemo from '@components/site/BlogRequestDemo.astro';
\`\`\`

**Step 5 — Edit the article**
After the article is written, do a final editorial pass specifically looking for these patterns. Remove every instance:

1. **"X is not Y, but Z" constructions** — e.g. "This isn't a tooling problem, it's a process problem" or "The issue isn't frequency, but ownership." Rewrite these as direct statements.
2. **Tricolon structures** — three-item lists used for rhetorical effect, e.g. "It's fast, reliable, and cheap" or "Write it, review it, ship it." Break these up or cut to the most important item.
3. **SEO optimization** — update the title, subtitle, and description to be closer to what users would actually search for. Add relevant inline links to other Promptless blog posts where they fit naturally.

Rewrite the affected sentences. Do not just flag them.

**Step 6 — Commit and open a PR**
1. Derive a URL-safe slug from the title (lowercase, hyphens only, max 60 chars)
2. Save the article to \`src/content/blog/technical/{slug}.mdx\`
3. Run: \`git checkout -b articles/$(date +%Y-%m-%d)-{slug} origin/main\`
4. Run: \`git add src/content/blog/technical/{slug}.mdx && git commit -m "content: Add article — {title}"\`
5. Run: \`git push -u origin HEAD\`
6. Write the PR body to a temp file, then run: \`gh pr create --title "content: {title}" --body-file {tempfile} --base main --head articles/$(date +%Y-%m-%d)-{slug}\`
   PR body should include: **Keyword:** {keyword}, a summary of the article plan (format, thesis, Promptless connection), a note that it's an AI-generated draft needing review, and instructions to set \`hidden: false\` when ready to publish.
7. Capture the PR URL printed by that command

**Step 7 — Post to Slack**
Post a message to Slack channel C0ANY84P1DM (content-marketing) using the Slack MCP tools available to you. The message should include:
- The article title
- The keyword that was used
- A link to the PR URL

Example message format:
📝 *New blog draft ready for review*
*Title:* {title}
*Keyword:* \`{keyword}\`
*PR:* {pr_url}`;

  console.log(`\n🔍 Researching: "${keyword}"\n`);

  // Agentic loop with web search
  type Message = Anthropic.MessageParam;
  const messages: Message[] = [{ role: "user", content: userPrompt }];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const webSearchTool = [{ type: "web_search_20250305", name: "web_search" }] as any;

  let response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 8000,
    system: systemPrompt,
    tools: webSearchTool,
    messages,
  });

  // Run the agentic loop until we get a final text response
  while (response.stop_reason === "tool_use") {
    const assistantContent = response.content;
    messages.push({ role: "assistant", content: assistantContent });

    // Build tool results for all tool_use blocks
    const toolResults: Anthropic.ToolResultBlockParam[] = assistantContent
      .filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use")
      .map((toolUse) => {
        console.log(`  🌐 Searching: ${(toolUse.input as { query?: string }).query ?? toolUse.id}`);
        return {
          type: "tool_result" as const,
          tool_use_id: toolUse.id,
          // For server-side tools like web_search, Anthropic handles execution
          // and injects results. We pass an empty result; the API fills it in.
          content: "",
        };
      });

    messages.push({ role: "user", content: toolResults });

    response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 8000,
      system: systemPrompt,
      tools: webSearchTool,
      messages,
    });
  }

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  if (!text.trim()) {
    throw new Error("Claude returned an empty response");
  }

  return text.trim();
}

// Extract just the MDX portion from the agent output (plan comes first, then MDX)
function extractMdx(text: string): string {
  const mdxStart = text.indexOf("---\ntitle:");
  if (mdxStart === -1) return text.trim();
  return text.slice(mdxStart).trim();
}

// ─── git + GitHub ─────────────────────────────────────────────────────────────

function createPR(articleContent: string, keyword: string, fullOutput: string = articleContent): string {
  // Extract title from frontmatter to build a slug
  const titleMatch = articleContent.match(/title:\s*['"](.+?)['"]/);
  const title = titleMatch ? titleMatch[1] : keyword;
  const slug = slugify(title);
  const date = todayISO();
  const branchName = `articles/${date}-${slug}`;
  const filePath = `src/content/blog/technical/${slug}.mdx`;

  // Use a worktree so we don't need a clean working directory
  const worktreePath = path.join(REPO_ROOT, ".worktrees", branchName.replace(/\//g, "-"));
  exec("git fetch origin main");
  exec(`git worktree add -b ${branchName} ${worktreePath} origin/main`);

  const worktreeFilePath = path.join(worktreePath, filePath);
  fs.mkdirSync(path.dirname(worktreeFilePath), { recursive: true });
  console.log(`\n📝 Writing article to ${filePath}`);
  fs.writeFileSync(worktreeFilePath, articleContent + "\n");

  exec(`git add ${filePath}`, { cwd: worktreePath });
  exec(
    `git commit -m "content: Add AI-generated article — ${title}\n\nKeyword: ${keyword}\nGenerated by edu campaign script on ${date}"`,
    { cwd: worktreePath }
  );
  exec(`git push -u origin ${branchName}`, { cwd: worktreePath });
  exec(`git worktree remove --force ${worktreePath}`);

  // Extract the plan from the full output (agent outputs plan then MDX)
  const planMatch = fullOutput.match(/^([\s\S]*?)(?=---\ntitle:)/);
  const planSummary = planMatch ? planMatch[1].trim() : "";

  const prBody = `**Keyword:** \`${keyword}\`

${planSummary ? `## Article plan\n\n${planSummary}\n\n` : ""}## File

\`${filePath}\`

This is an AI-generated draft and needs human review before publishing. Set \`hidden: false\` in the frontmatter when ready to publish.`;

  const bodyFile = path.join(REPO_ROOT, ".pr-body.tmp");
  fs.writeFileSync(bodyFile, prBody);
  const prUrl = exec(
    `gh pr create --title "content: ${title}" --body-file ${bodyFile} --base main --head ${branchName}`
  );
  fs.unlinkSync(bodyFile);

  console.log(`\n✅ PR created: ${prUrl}`);
  return prUrl.trim();
}

// ─── Slack ────────────────────────────────────────────────────────────────────

async function notifySlack(prUrl: string, keyword: string, title: string): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("⚠️  SLACK_WEBHOOK_URL not set — skipping Slack notification");
    return;
  }

  const payload = {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `📝 *New blog article draft ready for review*`,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Title:*\n${title}` },
          { type: "mrkdwn", text: `*Keyword:*\n\`${keyword}\`` },
        ],
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "Review PR" },
            url: prUrl,
            style: "primary",
          },
        ],
      },
    ],
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.warn(`⚠️  Slack notification failed: ${res.status} ${await res.text()}`);
  } else {
    console.log("📣 Slack notification sent");
  }
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const keyword = process.env.KEYWORD ?? pickKeyword();
  console.log(`🎯 Keyword: "${keyword}"`);

  const fullOutput = await generateArticle(keyword);
  const articleContent = extractMdx(fullOutput);

  const titleMatch = articleContent.match(/title:\s*['"](.+?)['"]/);
  const title = titleMatch ? titleMatch[1] : keyword;
  console.log(`\n📄 Title: "${title}"`);

  const prUrl = createPR(articleContent, keyword, fullOutput);

  await notifySlack(prUrl, keyword, title);

  console.log("\n🎉 Done!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
