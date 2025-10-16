export type Modality = 'text2text' | 'text2image' | 'text2video' | 'text2audio' | 'textimage2text' | 'textimage2image';

export interface GenTemplate {
  id: string;
  workspace_id: string;
  name: string;
  prompt: string;
  model: string;
  modality: Modality;
  image_urls: string; // Comma-separated image URLs
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

export interface CreateGenTemplateRequest {
  name: string;
  prompt: string;
  model: string;
  modality: Modality;
  image_urls?: string; // Comma-separated image URLs
}

export interface UpdateGenTemplateRequest {
  name: string;
  prompt: string;
  model: string;
  modality: Modality;
  image_urls?: string; // Comma-separated image URLs
}