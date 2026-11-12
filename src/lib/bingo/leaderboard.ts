import { z } from "zod";

export const leaderboardSchema = z
  .object({
    status: z.literal("provisional"),
    updatedAt: z.iso.datetime({ offset: true }),
    entries: z
      .array(
        z
          .object({
            rank: z.number().int().min(1).max(1000),
            alias: z.string().regex(/^Player [A-F0-9]{10}$/),
            bingoLines: z.number().int().min(0).max(12),
            tellsFound: z.number().int().min(0).max(24),
          })
          .strict(),
      )
      .max(1000),
  })
  .strict();

export type Leaderboard = z.infer<typeof leaderboardSchema>;
