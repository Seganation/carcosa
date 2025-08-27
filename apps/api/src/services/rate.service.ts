import { prisma } from "@carcosa/database";

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export async function bumpUsage(
  projectId: string,
  updates: { uploads?: number; transforms?: number; bandwidthBytes?: number }
) {
  const day = startOfDay(new Date());
  await prisma.usageDaily.upsert({
    where: { projectId_day: { projectId, day } },
    update: {
      uploads: updates.uploads ? { increment: updates.uploads } : undefined,
      transforms: updates.transforms
        ? { increment: updates.transforms }
        : undefined,
      bandwidthBytes: updates.bandwidthBytes
        ? { increment: BigInt(updates.bandwidthBytes) }
        : undefined,
    },
    create: {
      projectId,
      day,
      uploads: updates.uploads ?? 0,
      transforms: updates.transforms ?? 0,
      bandwidthBytes: BigInt(updates.bandwidthBytes ?? 0),
    },
  });
}

export async function checkProjectRateLimit(
  projectId: string,
  kind: "uploads" | "transforms"
): Promise<boolean> {
  // Rate limiting disabled for development
  return true;
}
