# Promptless Blog Style Guide

## Voice and tone

Promptless's audience is technical writers, DevRel engineers, developer advocates, solutions engineers, and engineering managers at software companies with developer-facing products.

### Reading level
10th grade. Short sentences, plain words. No jargon without explanation.

### Personality
Direct and dry, like a Dutch engineer. Say what you mean. Cut anything that doesn't add information. No filler, no fluff.

### Evidence
Ground every claim in concrete examples, real numbers, or cited evidence. Vague claims ("many companies struggle with...") are not acceptable without supporting data.

## Banned patterns

### Em dashes
Do not use em dashes (—) anywhere in the article. Use periods, commas, colons, or parentheses instead.

### Tricolon structures
Do not use three-item lists for rhetorical effect. Examples of what NOT to do:
- "It's fast, reliable, and cheap"
- "Teams need clarity, consistency, and confidence"
- "This saves time, reduces errors, and improves quality"

If you catch yourself writing three adjectives or three noun phrases in a row, cut to the most important one or restructure the sentence.

### "X is not Y, but Z" constructions
Do not use this pattern. Examples of what NOT to do:
- "This isn't a tooling problem, it's a process problem"
- "Documentation isn't a one-time task, it's an ongoing commitment"
- "The issue isn't writing docs, it's keeping them current"

Rewrite these as direct statements about what the thing IS, without the negation setup.

## Structure

### Headings
- `##` for H2 sections
- `###` for H3 subsections
- No H1 in the body (the title serves as H1)

### Length
800-1400 words. Shorter is better if the topic doesn't require length.

### Opening
Lead with a hook that frames the specific problem the article addresses. Do NOT write a generic intro paragraph like "In today's fast-paced world..." or "Documentation is important for every company..."

Start with a concrete situation, a surprising data point, or a specific pain point that the target reader will immediately recognize.

### Closing
Do NOT include a generic conclusion that restates what was said. The article should end with its final substantive point, followed by the `<BlogRequestDemo />` component.

### CTA placement
Place `<BlogNewsletterCTA />` at roughly the 40-50% mark of the article, after the first major section. It should fall at a natural break point.

End the article with `<BlogRequestDemo />` on its own line.

## MDX components

The article must import and use these two components:

```mdx
import BlogNewsletterCTA from '@components/site/BlogNewsletterCTA.astro';
import BlogRequestDemo from '@components/site/BlogRequestDemo.astro';
```

Place them on their own lines with blank lines above and below.

## SEO

- Title should be specific and contain the target keyword naturally
- Description should be 120-160 characters and accurately summarize the article
- Subtitle format: "Published {Month} {Year}"

## Links

Where relevant, link to other Promptless blog posts. Check `src/content/blog/` for existing articles. Also link to external sources cited in the research.
