import { prisma } from "@carcosa/database";
import type { CreateTokenInput, UpdateTokenInput } from "../validations/tokens.validation.js";
import { randomBytes } from "crypto";

export class TokensService {
  async listByProject(projectId: string, ownerId: string) {
    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId },
    });

    if (!project) {
      throw new Error("project_not_found");
    }

    return prisma.token.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: string, projectId: string, ownerId: string) {
    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId },
    });

    if (!project) {
      throw new Error("project_not_found");
    }

    return prisma.token.findFirst({
      where: { id, projectId },
    });
  }

  async create(data: CreateTokenInput, projectId: string, ownerId: string) {
    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId },
    });

    if (!project) {
      throw new Error("project_not_found");
    }

    // Generate a secure token
    const tokenValue = randomBytes(32).toString("hex");
    const keyHash = await this.hashToken(tokenValue);

    const token = await prisma.token.create({
      data: {
        projectId,
        name: data.name,
        description: data.description,
        keyHash,
      },
    });

    // Return the token with the plaintext value (only shown once)
    return {
      ...token,
      token: tokenValue,
    };
  }

  async update(id: string, data: UpdateTokenInput, projectId: string, ownerId: string) {
    const token = await this.getById(id, projectId, ownerId);
    if (!token) {
      throw new Error("token_not_found");
    }

    return prisma.token.update({
      where: { id },
      data,
    });
  }

  async revoke(id: string, projectId: string, ownerId: string) {
    const token = await this.getById(id, projectId, ownerId);
    if (!token) {
      throw new Error("token_not_found");
    }

    return prisma.token.update({
      where: { id },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async delete(id: string, projectId: string, ownerId: string) {
    const token = await this.getById(id, projectId, ownerId);
    if (!token) {
      throw new Error("token_not_found");
    }

    await prisma.token.delete({
      where: { id },
    });

    return { ok: true };
  }

  async validateToken(tokenValue: string, projectId: string) {
    const token = await prisma.token.findFirst({
      where: {
        projectId,
        keyHash: await this.hashToken(tokenValue),
        revokedAt: null,
      },
    });

    if (!token) {
      return null;
    }

    // Update last used timestamp
    await prisma.token.update({
      where: { id: token.id },
      data: { lastUsedAt: new Date() },
    });

    return token;
  }

  private async hashToken(token: string): Promise<string> {
    // Simple hash for now - in production, use bcrypt or similar
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }
}

export const tokensService = new TokensService();
