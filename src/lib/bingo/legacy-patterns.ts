import type { Tell } from "./patterns";

// Keep the original draft readable for boards already saved with photo evidence.
// New games use TELLS in patterns.ts; never relabel an old photo as a new tell.
export const LEGACY_TELLS: Tell[] = [
  {
    id: "totally-right",
    label: "“You’re totally right”",
    hint: "Look for instant agreement before the writer has checked the claim. Thoughtful agreement counts as ordinary conversation.",
    example:
      "“You’re totally right!” followed by a reversal of the previous answer.",
  },
  {
    id: "great-question",
    label: "“Great question!”",
    hint: "Find enthusiastic praise attached to a routine question, especially when every question gets the same treatment.",
    example: "“Great question!” in response to “What time does it close?”",
  },
  {
    id: "delve",
    label: "“Let’s delve”",
    hint: "Look for a grand invitation to explore something that only needs a short explanation.",
    example: "“Let’s delve into the intricacies of resetting your password.”",
  },
  {
    id: "landscape",
    label: "The evolving landscape",
    hint: "Find an introduction about a rapidly evolving landscape before the actual topic appears.",
    example: "“In the ever-evolving landscape of office stationery…”",
  },
  {
    id: "tapestry",
    label: "A rich tapestry",
    hint: "Find a tapestry metaphor doing the work of a specific description. A literal textile does not count!",
    example: "“A rich tapestry of ideas, innovation, and possibility.”",
  },
  {
    id: "seamless",
    label: "Seamless promises",
    hint: "Look for a promise of effortless integration with no explanation of what connects or what can go wrong.",
    example: "“Seamlessly integrate everything into your workflow.”",
  },
  {
    id: "leverage",
    label: "“Leverage” overload",
    hint: "Find several uses of “leverage” in a short passage where “use” would have done the job.",
    example: "“Leverage insights to leverage the tools your team leverages.”",
  },
  {
    id: "robust",
    label: "Robust & scalable",
    hint: "Find these adjectives standing in for evidence. Concrete capacity or reliability measurements are a different story.",
    example: "“A robust, scalable solution for all your needs.”",
  },
  {
    id: "not-just",
    label: "Not just X, but Y",
    hint: "Find a dramatic correction that makes a small thing sound momentous. Look for a repeated formula.",
    example: "“It’s not just a checklist; it’s a philosophy.”",
  },
  {
    id: "triple",
    label: "Three neat adjectives",
    hint: "Spot a polished trio of adjectives with little detail behind them. The pattern matters more than any one word.",
    example: "“Dynamic, intuitive, transformative.”",
  },
  {
    id: "dash",
    label: "Dashes everywhere",
    hint: "Find several sentences in a row interrupted by em dashes. One dash is just punctuation; humans love them too.",
    example: "An aside inside an aside, repeated across the paragraph.",
  },
  {
    id: "bold",
    label: "Every bullet is bold",
    hint: "Look for a list where every item starts with a bold mini-heading and repeats that heading in the sentence.",
    example: "“**Efficiency:** Efficiency helps you work efficiently.”",
  },
  {
    id: "recap",
    label: "The unnecessary recap",
    hint: "Find a conclusion that repeats a very short answer without adding anything.",
    example:
      "Three lines of instructions followed by “To summarize…” and the same three lines.",
  },
  {
    id: "both-sides",
    label: "Automatic both-sides",
    hint: "Look for symmetry imposed on an uneven question, without weighing evidence or choosing a useful answer.",
    example:
      "“There are benefits and drawbacks” with no explanation of which matter.",
  },
  {
    id: "depends",
    label: "“It depends” … stops",
    hint: "Find a qualified answer that never says what it depends on or how to decide.",
    example: "“Ultimately, it depends on your unique needs.” Full stop.",
  },
  {
    id: "vague-source",
    label: "Experts, unnamed",
    hint: "Find an appeal to research or experts with no traceable source. This is a reason to ask for evidence, not infer authorship.",
    example:
      "“Experts agree this is the most effective approach.” Which experts?",
  },
  {
    id: "precision",
    label: "Suspiciously precise",
    hint: "Find a very specific number with no source, method, or context. Take a photo; don’t assume the number is false.",
    example: "“This approach improves creativity by 42.7%.”",
  },
  {
    id: "placeholder",
    label: "[Insert detail here]",
    hint: "Find an unfilled drafting placeholder in something presented as finished.",
    example: "“We’re delighted to welcome [CLIENT NAME] to the team.”",
  },
  {
    id: "markdown",
    label: "Markdown in the wild",
    hint: "Find raw formatting syntax in a place where it was meant to render as prose.",
    example: "A printed flyer that still says “## Key benefits”.",
  },
  {
    id: "as-ai",
    label: "“As an AI…”",
    hint: "Find a model’s self-description accidentally left in a finished document. An article intentionally quoting it is a different use.",
    example:
      "“As an AI language model, I don’t have personal experiences…” in a product review.",
  },
  {
    id: "happy-help",
    label: "“Happy to help!”",
    hint: "Find an assistant-style offer accidentally carried into finished copy, where there is nobody to follow up with.",
    example:
      "A published guide ending “Let me know if you’d like me to expand this!”",
  },
  {
    id: "prompt-echo",
    label: "The prompt peeks out",
    hint: "Look for language about writing the requested text inside the finished text.",
    example:
      "“Here is a more professional version of your announcement:” on the announcement.",
  },
  {
    id: "voice-shift",
    label: "A sudden voice swap",
    hint: "Find a passage that abruptly switches tone or vocabulary without a clear reason. Editing or multiple authors can do this too.",
    example:
      "A casual event invite suddenly becomes “We cordially invite your esteemed participation.”",
  },
  {
    id: "empty-example",
    label: "An example of… nothing",
    hint: "Find an “example” that restates the advice instead of showing how to do it.",
    example:
      "“For example, improve communication by communicating more effectively.”",
  },
];
