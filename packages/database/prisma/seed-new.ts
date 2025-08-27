import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting comprehensive database seed...");

  // ============================================================================
  // CREATE USERS
  // ============================================================================
  console.log("\n👥 Creating users...");
  
  const adminEmail = "admin@carcosa.dev";
  const adminPassword = "admin123"; // Change this in production
  
  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!adminUser) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin User",
        passwordHash: hashedPassword,
      }
    });
    console.log("✅ Created admin user:", adminUser.email);
  } else {
    console.log("ℹ️  Admin user already exists:", adminUser.email);
  }

  // Create additional demo users
  const demoUsers = [
    {
      email: "developer@carcosa.dev",
      name: "Demo Developer",
      password: "dev123"
    },
    {
      email: "tester@carcosa.dev", 
      name: "Demo Tester",
      password: "test123"
    }
  ];

  for (const userData of demoUsers) {
    let user = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (!user) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          passwordHash: hashedPassword,
        }
      });
      console.log("✅ Created user:", user.email);
    } else {
      console.log("ℹ️  User already exists:", user.email);
    }
  }

  // ============================================================================
  // CREATE ORGANIZATIONS AND TEAMS
  // ============================================================================
  console.log("\n🏢 Creating organizations and teams...");

  // Create default organization for admin user
  let defaultOrg = await prisma.organization.findFirst({
    where: { ownerId: adminUser.id }
  });

  if (!defaultOrg) {
    // Create organization using transaction to ensure all related records are created
    defaultOrg = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: "Carcosa Organization",
          slug: "carcosa-org",
          description: "Default organization for Carcosa platform",
          ownerId: adminUser.id,
        },
      });

      // Add owner as organization member with OWNER role
      await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: adminUser.id,
          role: "OWNER",
        },
      });

      // Create default team
      const defaultTeam = await tx.team.create({
        data: {
          name: "Development Team",
          slug: "dev-team",
          description: "Main development team for all projects",
          organizationId: organization.id,
        },
      });

      // Add owner as team member with OWNER role
      await tx.teamMember.create({
        data: {
          teamId: defaultTeam.id,
          userId: adminUser.id,
          role: "OWNER",
        },
      });

      return { ...organization, defaultTeam };
    });

    console.log(`✅ Created organization: ${defaultOrg.name}`);
    console.log(`✅ Created default team: Development Team`);
  } else {
    console.log("ℹ️  Default organization already exists");
  }

  // Get the default team
  const defaultTeam = await prisma.team.findFirst({
    where: { organizationId: defaultOrg.id }
  });

  if (!defaultTeam) {
    throw new Error("Default team not found");
  }

  // ============================================================================
  // CREATE BUCKETS
  // ============================================================================
  console.log("\n🪣 Creating storage buckets...");
  
  const buckets = [
    {
      name: "Carcosa Demo Bucket",
      provider: "s3" as const,
      bucketName: "carcosa-demo",
      region: "us-east-1",
      endpoint: "http://localhost:9000", // MinIO default
      encryptedAccessKey: "minioadmin", // In production, this would be encrypted
      encryptedSecretKey: "minioadmin", // In production, this would be encrypted
      status: "connected" as const,
    },
    {
      name: "Cloudflare R2 Bucket",
      provider: "r2" as const,
      bucketName: "carcosa-r2-demo",
      region: "auto",
      endpoint: "https://your-account-id.r2.cloudflarestorage.com",
      encryptedAccessKey: "r2-access-key", // In production, this would be encrypted
      encryptedSecretKey: "r2-secret-key", // In production, this would be encrypted
      status: "connected" as const,
    },
    {
      name: "AWS S3 Bucket",
      provider: "s3" as const,
      bucketName: "carcosa-aws-demo",
      region: "us-west-2",
      endpoint: undefined, // Use AWS default
      encryptedAccessKey: "aws-access-key", // In production, this would be encrypted
      encryptedSecretKey: "aws-secret-key", // In production, this would be encrypted
      status: "testing" as const,
    }
  ];

  const createdBuckets: any[] = [];
  for (const bucketData of buckets) {
    const bucket = await prisma.bucket.upsert({
      where: {
        ownerId_bucketName_provider: {
          ownerId: adminUser.id,
          bucketName: bucketData.bucketName,
          provider: bucketData.provider
        }
      },
      update: {},
      create: {
        ...bucketData,
        ownerId: adminUser.id,
        lastChecked: new Date(),
      }
    });
    createdBuckets.push(bucket);
    console.log(`✅ Created/updated bucket: ${bucket.name} (${bucket.provider})`);
  }

  // ============================================================================
  // CREATE PROJECTS
  // ============================================================================
  console.log("\n🚀 Creating projects...");
  
  const projects = [
    {
      name: "Single Tenant Blog",
      slug: "blog-app",
      bucketId: createdBuckets[0].id,
      multiTenant: false,
      description: "A simple blog application with single tenant architecture"
    },
    {
      name: "Multi-Tenant SaaS Platform",
      slug: "saas-platform",
      bucketId: createdBuckets[0].id,
      multiTenant: true,
      description: "A SaaS platform supporting multiple organizations"
    },
    {
      name: "E-commerce Store",
      slug: "ecommerce-store",
      bucketId: createdBuckets[1].id,
      multiTenant: false,
      description: "Online store for selling products"
    },
    {
      name: "Multi-Tenant CMS",
      slug: "multi-cms",
      bucketId: createdBuckets[2].id,
      multiTenant: true,
      description: "Content management system for multiple clients"
    }
  ];

  const createdProjects: any[] = [];
  for (const projectData of projects) {
    const project = await prisma.project.upsert({
      where: { slug: projectData.slug },
      update: { teamId: defaultTeam.id }, // Update existing projects to have team
      create: {
        name: projectData.name,
        slug: projectData.slug,
        bucketId: projectData.bucketId,
        ownerId: adminUser.id,
        multiTenant: projectData.multiTenant,
        teamId: defaultTeam.id, // Assign to default team
      }
    });
    createdProjects.push(project);
    console.log(`✅ Created/updated project: ${project.name} (Multi-tenant: ${project.multiTenant})`);
  }

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================
  console.log("\n🎉 Database seeding completed successfully!");
  console.log("\n📋 Demo Data Summary:");
  console.log(`   👥 Users: ${await prisma.user.count()} (Admin: ${adminEmail}, password: ${adminPassword})`);
  console.log(`   🏢 Organizations: ${await prisma.organization.count()}`);
  console.log(`   👥 Teams: ${await prisma.team.count()}`);
  console.log(`   👤 Team Members: ${await prisma.teamMember.count()}`);
  console.log(`   🏘️  Org Members: ${await prisma.organizationMember.count()}`);
  console.log(`   🪣 Buckets: ${await prisma.bucket.count()} (S3, R2, AWS)`);
  console.log(`   🚀 Projects: ${await prisma.project.count()} (${createdProjects.filter((p: any) => p.multiTenant).length} multi-tenant)`);
  
  console.log("\n🚀 You can now:");
  console.log("   1. Login with admin@carcosa.dev / admin123");
  console.log("   2. Browse organizations and teams");
  console.log("   3. Explore projects organized by teams");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
