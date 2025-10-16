import axios from 'axios';
import { GenTemplate, CreateGenTemplateRequest, UpdateGenTemplateRequest } from '@/types/gen-template';

export const getGenTemplates = async (workspaceId: string, pageNum: number, pageSize: number, query: string) => {
  const response = await axios.get<GenTemplate[]>(
    `/api/v1/workspaces/${workspaceId}/gen-templates?pageSize=${pageSize}&pageNumber=${pageNum}&query=${query}`,
    { withCredentials: true }
  );
  return response.data;
};

export const getGenTemplate = async (workspaceId: string, templateId: string) => {
  const response = await axios.get<GenTemplate>(
    `/api/v1/workspaces/${workspaceId}/gen-templates/${templateId}`,
    { withCredentials: true }
  );
  return response.data;
};

export const createGenTemplate = async (workspaceId: string, data: CreateGenTemplateRequest) => {
  const response = await axios.post<GenTemplate>(
    `/api/v1/workspaces/${workspaceId}/gen-templates`,
    data,
    { withCredentials: true }
  );
  return response.data;
};

export const updateGenTemplate = async (workspaceId: string, templateId: string, data: UpdateGenTemplateRequest) => {
  const response = await axios.put<GenTemplate>(
    `/api/v1/workspaces/${workspaceId}/gen-templates/${templateId}`,
    data,
    { withCredentials: true }
  );
  return response.data;
};

export const deleteGenTemplate = async (workspaceId: string, templateId: string) => {
  const response = await axios.delete(
    `/api/v1/workspaces/${workspaceId}/gen-templates/${templateId}`,
    { withCredentials: true }
  );
  return response.data;
};