import React, { forwardRef } from "react";
import type { TransformOptions } from "@carcosa/types";
import { CarcosaClient } from "@carcosa/sdk";

export interface CmageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  projectId: string;
  tenantId?: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "jpeg" | "png" | "avif";
  placeholder?: "empty" | "blur";
  priority?: boolean;
  baseUrl?: string;
  version?: number;
}

function buildTransform(opts: Pick<CmageProps, "width" | "height" | "quality" | "format">): TransformOptions {
  const t: TransformOptions = {};
  if (opts.width) t.width = opts.width;
  if (opts.height) t.height = opts.height;
  if (opts.quality) t.quality = opts.quality;
  if (opts.format) t.format = opts.format;
  return t;
}

export const Cmage = forwardRef<HTMLImageElement, CmageProps>(function Cmage(
  { src, projectId, baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", version, width, height, quality, format, placeholder, priority, ...rest },
  ref
) {
  const client = new CarcosaClient({ baseUrl });
  const url = client.getSignedImageUrl({ projectId, path: src, transform: buildTransform({ width, height, quality, format }), version });

  let srcSet: string | undefined;
  if (width) {
    const t2x = buildTransform({ width: width * 2, height, quality, format });
    srcSet = `${url} 1x, ${client.getSignedImageUrl({ projectId, path: src, transform: t2x, version })} 2x`;
  }

  return <img ref={ref} src={url} srcSet={srcSet} loading={priority ? "eager" : rest.loading ?? "lazy"} {...rest} />;
});

