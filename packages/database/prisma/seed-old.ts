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
  console.log("
🏢 Creating organizations and teams...");

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
      update: {},
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
  // CREATE TENANTS FOR MULTI-TENANT PROJECTS
  // ============================================================================
  console.log("\n🏢 Creating tenants for multi-tenant projects...");
  
  const multiTenantProjects = createdProjects.filter((p: any) => p.multiTenant);
  const createdTenants: any[] = [];

  for (const project of multiTenantProjects) {
    const tenantCount = project.slug === "saas-platform" ? 5 : 3;
    
    for (let i = 1; i <= tenantCount; i++) {
      const tenant = await prisma.tenant.upsert({
        where: {
          projectId_slug: {
            projectId: project.id,
            slug: `${project.slug}-tenant-${i}`
          }
        },
        update: {},
        create: {
          projectId: project.id,
          slug: `${project.slug}-tenant-${i}`,
          metadata: {
            name: `Tenant ${i} for ${project.name}`,
            description: `Demo tenant ${i} for ${project.name}`,
            plan: i === 1 ? "enterprise" : i === 2 ? "professional" : "starter",
            status: "active"
          }
        }
      });
      createdTenants.push(tenant);
      console.log(`✅ Created tenant: ${tenant.slug} for ${project.name}`);
    }
  }

  // ============================================================================
  // CREATE VERSIONS FOR PROJECTS
  // ============================================================================
  console.log("\n📚 Creating project versions...");
  
  for (const project of createdProjects) {
    const versions = ["v1", "v2", "beta"];
    
    for (const versionName of versions) {
      await prisma.version.upsert({
        where: {
          projectId_versionName: {
            projectId: project.id,
            versionName
          }
        },
        update: {},
        create: {
          projectId: project.id,
          versionName,
          isActive: versionName === "v1", // Only v1 is active by default
        }
      });
    }
    console.log(`✅ Created versions for ${project.name}: ${versions.join(", ")}`);
  }

  // ============================================================================
  // CREATE API KEYS AND TOKENS
  // ============================================================================
  console.log("\n🔑 Creating API keys and tokens...");
  
  for (const project of createdProjects) {
    // Create API keys with permissions
    const apiKeys = [
      { 
        label: "Production API Key", 
        keyHash: `hash-${project.slug}-prod-${Date.now()}`,
        permissions: ["read", "write", "delete"]
      },
      { 
        label: "Development API Key", 
        keyHash: `hash-${project.slug}-dev-${Date.now()}`,
        permissions: ["read", "write"]
      },
      { 
        label: "Testing API Key", 
        keyHash: `hash-${project.slug}-test-${Date.now()}`,
        permissions: ["read"]
      }
    ];

    for (const apiKeyData of apiKeys) {
      await prisma.apiKey.upsert({
        where: {
          id: `${project.slug}-${apiKeyData.label.toLowerCase().replace(/\s+/g, '-')}`
        },
        update: {},
        create: {
          id: `${project.slug}-${apiKeyData.label.toLowerCase().replace(/\s+/g, '-')}`,
          projectId: project.id,
          label: apiKeyData.label,
          keyHash: apiKeyData.keyHash,
          permissions: apiKeyData.permissions,
        }
      });
    }

    // Create tokens
    const tokens = [
      { name: "Admin Token", description: "Full access token for administrators" },
      { name: "Read Token", description: "Read-only access token" },
      { name: "Upload Token", description: "Token for file uploads only" }
    ];

    for (const tokenData of tokens) {
      await prisma.token.upsert({
        where: {
          id: `${project.slug}-${tokenData.name.toLowerCase().replace(/\s+/g, '-')}`
        },
        update: {},
        create: {
          id: `${project.slug}-${tokenData.name.toLowerCase().replace(/\s+/g, '-')}`,
          projectId: project.id,
          name: tokenData.name,
          description: tokenData.description,
          keyHash: `token-hash-${project.slug}-${Date.now()}`,
        }
      });
    }
    
    console.log(`✅ Created API keys and tokens for ${project.name}`);
  }

  // ============================================================================
  // CREATE RATE LIMIT CONFIGURATIONS
  // ============================================================================
  console.log("\n⚡ Creating rate limit configurations...");
  
  for (const project of createdProjects) {
    await prisma.rateLimitConfig.upsert({
      where: { projectId: project.id },
      update: {},
      create: {
        projectId: project.id,
        uploadsPerMinute: project.multiTenant ? 200 : 120,
        transformsPerMinute: project.multiTenant ? 600 : 360,
        bandwidthPerMonthMiB: project.multiTenant ? 2048 : 1024,
      }
    });
    console.log(`✅ Created rate limit config for ${project.name}`);
  }

  // ============================================================================
  // CREATE SAMPLE FILES
  // ============================================================================
  console.log("\n📁 Creating sample files...");
  
  const fileTypes = [
    { mimeType: "image/jpeg", extension: "jpg", size: 1024 * 1024 }, // 1MB
    { mimeType: "image/png", extension: "png", size: 2 * 1024 * 1024 }, // 2MB
    { mimeType: "application/pdf", extension: "pdf", size: 5 * 1024 * 1024 }, // 5MB
    { mimeType: "text/plain", extension: "txt", size: 1024 }, // 1KB
  ];

  for (const project of createdProjects) {
    const projectTenants = createdTenants.filter((t: any) => t.projectId === project.id);
    
    // Create files for each project
    for (let i = 1; i <= 5; i++) {
      const fileType = fileTypes[i % fileTypes.length];
      const tenantId = project.multiTenant && projectTenants.length > 0 
        ? projectTenants[i % projectTenants.length].id 
        : null;

      await prisma.file.upsert({
        where: {
          id: `${project.slug}-file-${i}`
        },
        update: {},
        create: {
          id: `${project.slug}-file-${i}`,
          projectId: project.id,
          tenantId,
          path: `uploads/${fileType.extension}/`,
          filename: `sample-${i}.${fileType.extension}`,
          size: BigInt(fileType.size),
          mimeType: fileType.mimeType,
          version: "v1",
          metadata: {
            uploadedBy: "demo",
            category: fileType.extension,
            tags: ["demo", "sample"]
          }
        }
      });
    }
    console.log(`✅ Created sample files for ${project.name}`);
  }

  // ============================================================================
  // CREATE TRANSFORMS
  // ============================================================================
  console.log("\n🔄 Creating image transforms...");
  
  const transformOptions = [
    { width: 800, height: 600, quality: 80, format: "webp" },
    { width: 1200, height: 800, quality: 90, format: "jpeg" },
    { width: 400, height: 300, quality: 70, format: "png" },
    { width: 1920, height: 1080, quality: 95, format: "jpeg" }
  ];

  for (const project of createdProjects) {
    const projectFiles = await prisma.file.findMany({
      where: { projectId: project.id },
      take: 3
    });

    for (const file of projectFiles) {
      const transformOption = transformOptions[Math.floor(Math.random() * transformOptions.length)];
      
      await prisma.transform.upsert({
        where: {
          id: `${file.id}-transform-${transformOption.width}x${transformOption.height}`
        },
        update: {},
        create: {
          id: `${file.id}-transform-${transformOption.width}x${transformOption.height}`,
          projectId: project.id,
          fileId: file.id,
          originalPath: file.path + file.filename,
          transformPath: `transforms/${transformOption.width}x${transformOption.height}/${file.filename}`,
          transformOptions,
          status: Math.random() > 0.2 ? "completed" : "processing", // 80% completed
          processingTime: Math.random() > 0.2 ? Math.floor(Math.random() * 5000) : null,
          completedAt: Math.random() > 0.2 ? new Date() : null,
        }
      });
    }
    console.log(`✅ Created transforms for ${project.name}`);
  }

  // ============================================================================
  // CREATE UPLOADS
  // ============================================================================
  console.log("\n📤 Creating upload records...");
  
  for (const project of createdProjects) {
    for (let i = 1; i <= 3; i++) {
      await prisma.upload.upsert({
        where: {
          id: `${project.slug}-upload-${i}`
        },
        update: {},
        create: {
          id: `${project.slug}-upload-${i}`,
          projectId: project.id,
          path: `uploads/batch-${i}/`,
          status: Math.random() > 0.3 ? "completed" : "processing",
        }
      });
    }
    console.log(`✅ Created upload records for ${project.name}`);
  }

  // ============================================================================
  // CREATE USAGE DATA
  // ============================================================================
  console.log("\n📊 Creating usage data...");
  
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date;
  });

  for (const project of createdProjects) {
    for (const date of last30Days) {
      await prisma.usageDaily.upsert({
        where: {
          projectId_day: {
            projectId: project.id,
            day: date
          }
        },
        update: {},
        create: {
          projectId: project.id,
          day: date,
          uploads: Math.floor(Math.random() * 50) + 10,
          transforms: Math.floor(Math.random() * 100) + 20,
          bandwidthBytes: BigInt(Math.floor(Math.random() * 100 * 1024 * 1024) + 10 * 1024 * 1024), // 10-110 MB
        }
      });
    }
    console.log(`✅ Created usage data for ${project.name} (last 30 days)`);
  }

  // ============================================================================
  // CREATE AUDIT LOGS
  // ============================================================================
  console.log("\n📝 Creating audit logs...");
  
  const auditActions = [
    "project_created",
    "file_uploaded", 
    "file_deleted",
    "transform_created",
    "api_key_rotated",
    "tenant_created",
    "tenant_updated",
    "rate_limit_updated"
  ];

  for (const project of createdProjects) {
    for (let i = 1; i <= 20; i++) {
      const action = auditActions[Math.floor(Math.random() * auditActions.length)];
      const date = new Date();
      date.setHours(date.getHours() - Math.floor(Math.random() * 168)); // Last week
      
      await prisma.auditLog.upsert({
        where: {
          id: `${project.slug}-audit-${i}`
        },
        update: {},
        create: {
          id: `${project.slug}-audit-${i}`,
          projectId: project.id,
          userId: adminUser.id,
          action,
          resource: `${action}_resource_${i}`,
          details: {
            timestamp: date.toISOString(),
            userAgent: "Mozilla/5.0 (Demo Browser)",
            ipAddress: "192.168.1.100",
            additionalInfo: `Demo audit log entry ${i}`
          },
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0 (Demo Browser)",
          createdAt: date,
        }
      });
    }
    console.log(`✅ Created audit logs for ${project.name}`);
  }

  // ============================================================================
  // CREATE SESSIONS AND ACCOUNTS (NextAuth)
  // ============================================================================
  console.log("\n🔐 Creating authentication data...");
  
  // Create a session for admin user
  await prisma.session.upsert({
    where: {
      id: "admin-session"
    },
    update: {},
    create: {
      id: "admin-session",
      userId: adminUser.id,
      sessionToken: "admin-session-token",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    }
  });

  // Create OAuth accounts
  await prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: "google",
        providerAccountId: "admin-google-id"
      }
    },
    update: {},
    create: {
      userId: adminUser.id,
      type: "oauth",
      provider: "google",
      providerAccountId: "admin-google-id",
      access_token: "google-access-token",
      token_type: "Bearer",
      scope: "openid email profile",
    }
  });

  console.log("✅ Created authentication data");

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================
  console.log("\n🎉 Comprehensive database seeding completed successfully!");
  console.log("\n📋 Demo Data Summary:");
  console.log(`   👥 Users: ${await prisma.user.count()} (Admin: ${adminEmail}, password: ${adminPassword})`);
  console.log(`   🏢 Organizations: ${await prisma.organization.count()}`);
  console.log(`   👥 Teams: ${await prisma.team.count()}`);
  console.log(`   👤 Team Members: ${await prisma.teamMember.count()}`);
  console.log(`   🏘️  Org Members: ${await prisma.organizationMember.count()}`);
  console.log(`   🪣 Buckets: ${await prisma.bucket.count()} (S3, R2, AWS)`);
  console.log(`   🚀 Projects: ${await prisma.project.count()} (${createdProjects.filter((p: any) => p.multiTenant).length} multi-tenant)`);
  console.log(`   🏢 Tenants: ${await prisma.tenant.count()}`);
  console.log(`   📁 Files: ${await prisma.file.count()}`);
  console.log(`   🔄 Transforms: ${await prisma.transform.count()}`);
  console.log(`   🔑 API Keys: ${await prisma.apiKey.count()}`);
  console.log(`   🔐 Tokens: ${await prisma.token.count()}`);
  console.log(`   📚 Versions: ${await prisma.version.count()}`);
  console.log(`   ⚡ Rate Limits: ${await prisma.rateLimitConfig.count()}`);
  console.log(`   📊 Usage Records: ${await prisma.usageDaily.count()}`);
  console.log(`   📝 Audit Logs: ${await prisma.auditLog.count()}`);
  console.log(`   📤 Uploads: ${await prisma.upload.count()}`);
  console.log(`   🔐 Sessions: ${await prisma.session.count()}`);
  console.log(`   🔗 OAuth Accounts: ${await prisma.account.count()}`);
  
  console.log("\n🚀 You can now:");
  console.log("   1. Login with admin@carcosa.dev / admin123");
  console.log("   2. Explore the multi-tenant projects");
  console.log("   3. Test file uploads and transforms");
  console.log("   4. Manage tenants and API keys");
  console.log("   5. View usage analytics and audit logs");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
