import { Request, Response, NextFunction } from "express";

// Transform operation types
export type TransformOperation =
  | "resize"
  | "crop"
  | "format"
  | "quality"
  | "blur"
  | "sharpen"
  | "rotate"
  | "flip"
  | "watermark"
  | "background"
  | "optimize";

// Transform parameters
export interface TransformParams {
  resize?: {
    width?: number;
    height?: number;
    fit?: "cover" | "contain" | "fill" | "inside" | "outside";
    position?:
      | "top"
      | "right-top"
      | "right"
      | "right-bottom"
      | "bottom"
      | "left-bottom"
      | "left"
      | "left-top"
      | "center";
  };
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  format?: {
    type: "jpeg" | "png" | "webp" | "avif" | "gif";
    quality?: number;
    progressive?: boolean;
  };
  quality?: number;
  blur?: number;
  sharpen?: number;
  rotate?: number;
  flip?: "horizontal" | "vertical" | "both";
  watermark?: {
    text?: string;
    image?: string;
    position?:
      | "top-left"
      | "top"
      | "top-right"
      | "left"
      | "center"
      | "right"
      | "bottom-left"
      | "bottom"
      | "bottom-right";
    opacity?: number;
    size?: number;
  };
  background?: {
    color?: string;
    image?: string;
  };
  optimize?: boolean;
}

// Transform job status
export type TransformStatus = "pending" | "processing" | "completed" | "failed";

// Transform job
export interface TransformJob {
  id: string;
  fileKey: string;
  projectId: string;
  operations: TransformOperation[];
  params: TransformParams;
  status: TransformStatus;
  progress: number;
  result?: {
    url: string;
    size: number;
    format: string;
    metadata: Record<string, any>;
  };
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// Transform pipeline configuration
export interface TransformPipelineConfig {
  maxConcurrentJobs: number;
  jobTimeout: number;
  retryAttempts: number;
  storage: {
    provider: "s3" | "r2" | "gcs";
    bucket: string;
    region?: string;
  };
  cache: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
}

// Transform pipeline class
export class TransformPipeline {
  private jobs: Map<string, TransformJob> = new Map();
  private processing: Set<string> = new Set();
  private config: TransformPipelineConfig;

  constructor(config: TransformPipelineConfig) {
    this.config = config;
  }

  // Create a new transform job
  async createTransformJob(
    fileKey: string,
    projectId: string,
    operations: TransformOperation[],
    params: TransformParams
  ): Promise<TransformJob> {
    const jobId = this.generateJobId(fileKey, operations, params);

    // Check if transform already exists
    const existingJob = this.jobs.get(jobId);
    if (existingJob && existingJob.status === "completed") {
      return existingJob;
    }

    const job: TransformJob = {
      id: jobId,
      fileKey,
      projectId,
      operations,
      params,
      status: "pending",
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.jobs.set(jobId, job);

    // Start processing asynchronously if we have capacity
    if (this.processing.size < this.config.maxConcurrentJobs) {
      // Use setImmediate to defer processing so job is returned with 'pending' status
      setImmediate(() => this.processJob(job));
    }

    return job;
  }

  // Process a transform job
  private async processJob(job: TransformJob) {
    if (this.processing.has(job.id)) {
      return;
    }

    this.processing.add(job.id);
    job.status = "processing";
    job.updatedAt = new Date();

    try {
      // Simulate processing steps
      for (let i = 0; i <= 100; i += 10) {
        job.progress = i;
        job.updatedAt = new Date();
        await this.delay(100); // Simulate work
      }

      // TODO: Implement actual transform logic
      // This should:
      // 1. Download original file from storage
      // 2. Apply transforms using Sharp (images) or FFmpeg (video)
      // 3. Upload transformed file to storage
      // 4. Update job status

      job.status = "completed";
      job.progress = 100;
      job.completedAt = new Date();
      job.result = {
        url: `/t/${job.projectId}/${job.fileKey}?${this.paramsToQueryString(job.params)}`,
        size: 512000, // Placeholder
        format: "webp",
        metadata: {
          width: 800,
          height: 600,
          operations: job.operations,
        },
      };
    } catch (error) {
      job.status = "failed";
      job.error = (error as Error).message;
      job.updatedAt = new Date();
    } finally {
      this.processing.delete(job.id);

      // Process next pending job
      this.processNextJob();
    }
  }

  // Process next pending job
  private processNextJob() {
    for (const [jobId, job] of Array.from(this.jobs.entries())) {
      if (job.status === "pending" && !this.processing.has(jobId)) {
        this.processJob(job);
        break;
      }
    }
  }

  // Get job status
  getJobStatus(jobId: string): TransformJob | undefined {
    return this.jobs.get(jobId);
  }

  // Get all jobs for a file
  getFileJobs(fileKey: string, projectId: string): TransformJob[] {
    return Array.from(this.jobs.values()).filter(
      (job) => job.fileKey === fileKey && job.projectId === projectId
    );
  }

  // Cancel a job
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (job && job.status === "pending") {
      job.status = "failed";
      job.error = "Cancelled by user";
      job.updatedAt = new Date();
      return true;
    }
    return false;
  }

  // Generate job ID from parameters
  private generateJobId(
    fileKey: string,
    operations: TransformOperation[],
    params: TransformParams
  ): string {
    const paramsHash = Buffer.from(JSON.stringify(params))
      .toString("base64")
      .replace(/[+/=]/g, "");
    return `${fileKey}_${operations.join("_")}_${paramsHash}`.substring(0, 64);
  }

  // Convert params to query string
  private paramsToQueryString(params: TransformParams): string {
    const query: string[] = [];

    if (params.resize) {
      if (params.resize.width) query.push(`w=${params.resize.width}`);
      if (params.resize.height) query.push(`h=${params.resize.height}`);
      if (params.resize.fit) query.push(`fit=${params.resize.fit}`);
    }

    if (params.format?.type) query.push(`f=${params.format.type}`);
    if (params.quality) query.push(`q=${params.quality}`);
    if (params.blur) query.push(`blur=${params.blur}`);
    if (params.rotate) query.push(`r=${params.rotate}`);

    return query.join("&");
  }

  // Utility delay function
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Transform middleware for Express
export class TransformMiddleware {
  constructor(private pipeline: TransformPipeline) {}

  // Handle transform requests
  async handleTransform(req: Request, res: Response, next: NextFunction) {
    try {
      const { fileKey, projectId } = req.params;
      const transforms = req.query;

      if (!fileKey || !projectId) {
        return res
          .status(400)
          .json({ error: "File key and project ID required" });
      }

      // Parse transform parameters
      const operations: TransformOperation[] = [];
      const params: TransformParams = {};

      // Parse resize parameters
      if (transforms.w || transforms.h) {
        operations.push("resize");
        params.resize = {
          width: transforms.w ? parseInt(transforms.w as string) : undefined,
          height: transforms.h ? parseInt(transforms.h as string) : undefined,
          fit: (transforms.fit as any) || "cover",
        };
      }

      // Parse format parameters
      if (transforms.f) {
        operations.push("format");
        params.format = {
          type: transforms.f as any,
          quality: transforms.q ? parseInt(transforms.q as string) : undefined,
        };
      }

      // Parse quality parameter
      if (transforms.q && !params.format) {
        params.quality = parseInt(transforms.q as string);
      }

      // Parse other parameters
      if (transforms.blur) {
        operations.push("blur");
        params.blur = parseInt(transforms.blur as string);
      }

      if (transforms.r) {
        operations.push("rotate");
        params.rotate = parseInt(transforms.r as string);
      }

      // Create transform job
      const job = await this.pipeline.createTransformJob(
        fileKey,
        projectId,
        operations,
        params
      );

      // If job is already completed, return result immediately
      if (job.status === "completed" && job.result) {
        return res.json({
          status: "completed",
          result: job.result,
          jobId: job.id,
        });
      }

      // Return job status
      res.json({
        status: job.status,
        progress: job.progress,
        jobId: job.id,
        estimatedTime: this.estimateTime(job),
      });
    } catch (error) {
      next(error);
    }
  }

  // Estimate processing time
  private estimateTime(job: TransformJob): number {
    // Simple estimation based on operations
    const baseTime = 1000; // 1 second base
    const operationTime = job.operations.length * 500; // 500ms per operation
    return baseTime + operationTime;
  }
}

// Factory function to create transform pipeline
export function createTransformPipeline(
  config: TransformPipelineConfig
): TransformPipeline {
  return new TransformPipeline(config);
}

// Factory function to create transform middleware
export function createTransformMiddleware(
  pipeline: TransformPipeline
): TransformMiddleware {
  return new TransformMiddleware(pipeline);
}
