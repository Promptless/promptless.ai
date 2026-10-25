import { LEGACY_TELLS } from "./legacy-patterns";

export interface Tell {
  id: string;
  label: string;
  hint: string;
  example: string;
}

// Approved October 24, 2026. Original hypothetical examples, not quotations
// from the research sample. These are writing habits, never proof of authorship.
export const TELLS: Tell[] = [
  {
    id: "contrast",
    label: "Not X. It’s Y.",
    hint: "Find a dramatic reframe that dismisses one explanation and replaces it with another. Variations include “This isn’t about X. It’s about Y.”",
    example: "This isn’t a productivity problem. It’s a clarity problem.",
  },
  {
    id: "rule-of-three",
    label: "Everything comes in threes",
    hint: "Look for two or more polished trios in the same passage: three adjectives, three benefits, three audiences. One ordinary list of three is an easy coincidence.",
    example: "Faster, simpler, smarter. Built for teams, leaders, and creators.",
  },
  {
    id: "asyndetic-parataxis",
    label: "Asyndetic parataxis",
    hint: "Short clauses placed side by side, without connecting words like “and,” “but,” or “because.” Hunt for a run of four or more. Bonus writer points for dropped subjects you infer from context (ellipsis) and several lines that each sound like the ending (repeated rhetorical closure).",
    example: "The launch slipped. The team regrouped. Cut the scope. Shipped on Friday. That was the lesson. That was the work.",
  },
  {
    id: "self-answer",
    label: "Ask a question. Answer it.",
    hint: "Spot a tiny question immediately answered by the same writer to manufacture a reveal: “The catch?” “The result?” “The difference?”",
    example: "The catch? There isn’t one.",
  },
  {
    id: "revelation",
    label: "The promised revelation",
    hint: "Find a setup promising a hidden truth, uncomfortable reality, or something nobody is talking about before revealing the point.",
    example: "Here’s the uncomfortable truth nobody’s talking about.",
  },
  {
    id: "mic-drop",
    label: "The mic-drop closer",
    hint: "Look for a final sentence that turns an ordinary story into a sweeping lesson. This square is about the ending’s job, rather than a particular sentence length.",
    example: "And that’s when a tool becomes a movement.",
  },
  {
    id: "keep-returning",
    label: "“I keep coming back to…”",
    hint: "Find this reflective setup used to introduce a question or big idea, even when the piece hasn’t shown any earlier reflection.",
    example: "I keep coming back to one question: what are we actually optimizing for?",
  },
  {
    id: "bold-labels",
    label: "Bold-label bullet stack",
    hint: "Find three or more bullets that each open with a bold mini-heading followed by a colon and a short explanation. Look at the formatting as well as the words.",
    example: "• **Clarity:** Know the goal. • **Speed:** Remove friction. • **Scale:** Grow confidently.",
  },
  {
    id: "follow-up-offer",
    label: "“If you want, I can…”",
    hint: "Spot an assistant-style closing offer to turn the answer into a checklist, table, plan, or another format. It can appear in a chat or sneak into published copy.",
    example: "If you want, I can turn this into a checklist.",
  },
  {
    id: "emoji-parade",
    label: "Emoji section parade",
    hint: "Look for three or more sections or list items, each introduced by its own illustrative emoji. A single celebratory emoji is just an emoji.",
    example: "🚀 Launch faster. 💡 Work smarter. ✅ Stay aligned.",
  },
  {
    id: "fancy-separators",
    label: "Arrows, bullets & fancy separators",
    hint: "Find a conspicuous arrangement of arrows, geometric bullets, or decorative separators organizing three or more short items. This square is about special characters rather than emoji pictures.",
    example: "→ Less busywork • More focus ◆ Better results",
  },
  {
    id: "dash-heavy",
    label: "Dashes on dashes",
    hint: "Look for three or more em dashes packed into a short passage, adding asides or dramatic pauses. A single dash doesn’t count; humans love them too.",
    example: "The fix—which sounds simple—is the thing teams skip—every time.",
  },
  {
    id: "instant-agreement",
    label: "“You’re right!” opener",
    hint: "Find an answer that begins with emphatic agreement, especially before checking the claim or when reversing its own previous advice. “You’re totally right” counts too.",
    example: "You’re absolutely right—that’s exactly the distinction that matters.",
  },
  {
    id: "progress-narration",
    label: "“I’ll X, then Y”",
    hint: "Look for an assistant narrating the steps it is about to take before doing the work. A repeated sequence of progress announcements is an especially good find.",
    example: "I’ll inspect the files, trace the issue, then make a focused fix.",
  },
  {
    id: "scope-reassurance",
    label: "Reassuring what didn’t change",
    hint: "Find an update that volunteers reassurance about everything left untouched, even when nobody asked about it. Specific, requested change notes are ordinary reporting.",
    example: "I updated the button. Everything else stays exactly as it was.",
  },
  {
    id: "superlatives",
    label: "Superlative overload",
    hint: "Look for a cluster of biggest, best, most powerful, or most transformative claims that outruns the supporting detail. One measured comparison is different.",
    example: "The most powerful, most intuitive, most transformative solution yet.",
  },
  {
    id: "shape-of",
    label: "“The shape of…”",
    hint: "Find “shape” used as an abstract stand-in for the plan, approach, answer, or solution. A literal shape or diagram doesn’t count.",
    example: "Before we build, let’s agree on the shape of the solution.",
  },
  {
    id: "announced-sincerity",
    label: "“Real,” “honest,” “genuinely”",
    hint: "Find words announcing sincerity or importance: “the real problem,” “the honest answer,” “genuinely remarkable.” Literal meanings such as “real estate” don’t count.",
    example: "The honest answer? The real opportunity is genuinely exciting.",
  },
  {
    id: "abstract-aphorism",
    label: "The abstract aphorism",
    hint: "Spot a polished, quotable declaration connecting big abstract nouns. It sounds profound, but you have to supply the concrete meaning yourself.",
    example: "Clarity is the architecture of trust.",
  },
  {
    id: "game-changer",
    label: "“A game changer”",
    hint: "Find an ordinary improvement promoted to a game changer, especially when the phrase replaces an explanation of what improved.",
    example: "This small workflow change has been a game changer.",
  },
  {
    id: "quietly-big",
    label: "“Quietly” doing something big",
    hint: "Look for “quietly” paired with a sweeping transformation: quietly reshaping, revolutionizing, or changing an entire field. Literal silence doesn’t count.",
    example: "This tiny team is quietly changing how an entire industry works.",
  },
  {
    id: "repeated-opening",
    label: "Same opening, three times",
    hint: "Find three successive clauses or sentences beginning with the same word or phrase. Writers call this anaphora; here you’re hunting the repeated opening.",
    example: "We tested the process. We tested the people. We tested the assumptions.",
  },
  {
    id: "testament",
    label: "“A testament to…”",
    hint: "Spot an event or achievement presented as “a testament to” a broad virtue, such as resilience, collaboration, or innovation.",
    example: "This milestone is a testament to the power of collaboration.",
  },
  {
    id: "numbered-framework",
    label: "The instant numbered framework",
    hint: "Find an answer that packages a topic into a tidy numbered framework, often giving each step a punchy one-word name. Actual ordered instructions alone aren’t the pattern.",
    example: "The five-part framework: Define. Design. Build. Test. Scale.",
  },
];

export const TELL_SETS = [TELLS, LEGACY_TELLS];
export const TELL_BY_ID = new Map(
  TELL_SETS.flat().map((tell) => [tell.id, tell]),
);
