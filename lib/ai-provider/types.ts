/**
 * AI Provider Interface
 * All AI providers must implement this contract.
 */

export interface GenerateImageOptions {
  prompt: string;
  referenceImages?: string[]; // base64 or URLs
  width?: number;
  height?: number;
  quality?: "standard" | "high";
}

export interface GenerateImageResult {
  imageBase64: string;  // base64 encoded result
  mimeType: string;
  provider: string;
  model: string;
  metadata?: Record<string, unknown>;
}

export interface DescribeImageOptions {
  imageUrl?: string;
  imageBase64?: string;
  mimeType?: string;
}

export interface DescribeImageResult {
  prompt: string;
  description: string;
  provider: string;
  model: string;
}

export interface AIProvider {
  name: string;
  generateImage(options: GenerateImageOptions): Promise<GenerateImageResult>;
  describeImage(options: DescribeImageOptions): Promise<DescribeImageResult>;
}
