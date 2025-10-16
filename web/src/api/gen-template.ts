import axios from 'axios';
import { GenTemplate, CreateGenTemplateRequest, UpdateGenTemplateRequest, GenHistory, GenerateFromTemplateRequest, GenerateFromTemplateResponse } from '@/types/gen-template';

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

export const generateFromTemplate = async (workspaceId: string, data: GenerateFromTemplateRequest) => {
  const response = await axios.post<GenerateFromTemplateResponse>(
    `/api/v1/workspaces/${workspaceId}/gen-templates/generate`,
    data,
    { withCredentials: true }
  );
  return response.data;
};

export const getGenHistories = async (workspaceId: string, pageNum: number, pageSize: number, templateId?: string) => {
  const params = new URLSearchParams({
    pageSize: pageSize.toString(),
    pageNumber: pageNum.toString(),
  });
  if (templateId) {
    params.append('templateId', templateId);
  }
  const response = await axios.get<GenHistory[]>(
    `/api/v1/workspaces/${workspaceId}/gen-history?${params.toString()}`,
    { withCredentials: true }
  );
  return response.data;
};

export const getGenHistory = async (workspaceId: string, historyId: string) => {
  const response = await axios.get<GenHistory>(
    `/api/v1/workspaces/${workspaceId}/gen-history/${historyId}`,
    { withCredentials: true }
  );
  return response.data;
};

export const deleteGenHistory = async (workspaceId: string, historyId: string) => {
  const response = await axios.delete(
    `/api/v1/workspaces/${workspaceId}/gen-history/${historyId}`,
    { withCredentials: true }
  );
  return response.data;
};