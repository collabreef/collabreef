import axios from 'axios';
import { View, CreateViewRequest, UpdateViewRequest, ViewType, ViewObject, CreateViewObjectRequest, UpdateViewObjectRequest, ViewObjectType, ViewObjectWithView } from '@/types/view';

export const getViews = async (workspaceId: string, pageNum: number = 1, pageSize: number = 100, type?: ViewType) => {
  const params = new URLSearchParams({
    pageSize: pageSize.toString(),
    pageNumber: pageNum.toString(),
  });

  if (type) {
    params.append('type', type);
  }

  const response = await axios.get(`/api/v1/workspaces/${workspaceId}/views?${params.toString()}`, { withCredentials: true });
  return response.data as View[];
};

export const getView = async (workspaceId: string, viewId: string) => {
  const response = await axios.get(`/api/v1/workspaces/${workspaceId}/views/${viewId}`, { withCredentials: true });
  return response.data as View;
};

export const createView = async (workspaceId: string, data: CreateViewRequest) => {
  const response = await axios.post(`/api/v1/workspaces/${workspaceId}/views`, data);
  return response.data as View;
};

export const updateView = async (workspaceId: string, viewId: string, data: UpdateViewRequest) => {
  const response = await axios.put(`/api/v1/workspaces/${workspaceId}/views/${viewId}`, data);
  return response.data as View;
};

export const deleteView = async (workspaceId: string, viewId: string) => {
  const response = await axios.delete(`/api/v1/workspaces/${workspaceId}/views/${viewId}`);
  return response.data;
};

// View Objects API
export const getViewObjects = async (workspaceId: string, viewId: string, pageNum: number = 1, pageSize: number = 100, type?: ViewObjectType) => {
  const params = new URLSearchParams({
    pageSize: pageSize.toString(),
    pageNumber: pageNum.toString(),
  });

  if (type) {
    params.append('type', type);
  }

  const response = await axios.get(`/api/v1/workspaces/${workspaceId}/views/${viewId}/objects?${params.toString()}`, { withCredentials: true });
  return response.data as ViewObject[];
};

export const getViewObject = async (workspaceId: string, viewId: string, objectId: string) => {
  const response = await axios.get(`/api/v1/workspaces/${workspaceId}/views/${viewId}/objects/${objectId}`, { withCredentials: true });
  return response.data as ViewObject;
};

export const createViewObject = async (workspaceId: string, viewId: string, data: CreateViewObjectRequest) => {
  const response = await axios.post(`/api/v1/workspaces/${workspaceId}/views/${viewId}/objects`, data);
  return response.data as ViewObject;
};

export const updateViewObject = async (workspaceId: string, viewId: string, objectId: string, data: UpdateViewObjectRequest) => {
  const response = await axios.put(`/api/v1/workspaces/${workspaceId}/views/${viewId}/objects/${objectId}`, data);
  return response.data as ViewObject;
};

export const deleteViewObject = async (workspaceId: string, viewId: string, objectId: string) => {
  const response = await axios.delete(`/api/v1/workspaces/${workspaceId}/views/${viewId}/objects/${objectId}`);
  return response.data;
};

// View Object Notes API
export const getNotesForViewObject = async (workspaceId: string, viewId: string, objectId: string) => {
  const response = await axios.get(`/api/v1/workspaces/${workspaceId}/views/${viewId}/objects/${objectId}/notes`, { withCredentials: true });
  return response.data;
};

export const addNoteToViewObject = async (workspaceId: string, viewId: string, objectId: string, noteId: string) => {
  const response = await axios.post(`/api/v1/workspaces/${workspaceId}/views/${viewId}/objects/${objectId}/notes`, { note_id: noteId });
  return response.data;
};

export const removeNoteFromViewObject = async (workspaceId: string, viewId: string, objectId: string, noteId: string) => {
  const response = await axios.delete(`/api/v1/workspaces/${workspaceId}/views/${viewId}/objects/${objectId}/notes/${noteId}`);
  return response.data;
};

// Get view objects for a note
export const getViewObjectsForNote = async (workspaceId: string, noteId: string) => {
  const response = await axios.get(`/api/v1/workspaces/${workspaceId}/notes/${noteId}/view-objects`, { withCredentials: true });
  return response.data as ViewObjectWithView[];
};

// Public Views API
export const getPublicViews = async (pageNum: number, pageSize: number, type?: ViewType) => {
  const params = new URLSearchParams({
    pageSize: pageSize.toString(),
    pageNumber: pageNum.toString(),
  });

  if (type) {
    params.append('type', type);
  }

  const response = await axios.get(`/api/v1/public/views?${params.toString()}`, { withCredentials: true });
  return response.data as View[];
};

export const getPublicView = async (viewId: string) => {
  const response = await axios.get(`/api/v1/public/views/${viewId}`, { withCredentials: true });
  return response.data as View;
};

export const updateViewVisibility = async (workspaceId: string, viewId: string, visibility: string) => {
  const response = await axios.patch(`/api/v1/workspaces/${workspaceId}/views/${viewId}/visibility/${visibility}`);
  return response.data as View;
};

// Get view objects for a public note
export const getPublicViewObjectsForNote = async (noteId: string) => {
  const response = await axios.get(`/api/v1/public/notes/${noteId}/view-objects`, { withCredentials: true });
  return response.data as ViewObjectWithView[];
};

// Get view objects for a public view
export const getPublicViewObjects = async (viewId: string, pageNum: number = 1, pageSize: number = 100, type?: ViewObjectType) => {
  const params = new URLSearchParams({
    pageSize: pageSize.toString(),
    pageNumber: pageNum.toString(),
  });

  if (type) {
    params.append('type', type);
  }

  const response = await axios.get(`/api/v1/public/views/${viewId}/objects?${params.toString()}`, { withCredentials: true });
  return response.data as ViewObject[];
};

// Get notes for a public view object
export const getPublicNotesForViewObject = async (viewId: string, objectId: string) => {
  const response = await axios.get(`/api/v1/public/views/${viewId}/objects/${objectId}/notes`, { withCredentials: true });
  return response.data;
};