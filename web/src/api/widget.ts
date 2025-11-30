import axios from 'axios';

export type WidgetType = 'note_form' | 'stats' | 'template_form' | 'view' | 'note';

export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WidgetData {
  id?: string;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  type: WidgetType;
  config?: string;
  position?: string;
}

export interface CreateWidgetData {
  type: WidgetType;
  config?: string;
  position?: string;
}

export interface UpdateWidgetData {
  id: string;
  type?: WidgetType;
  config?: string;
  position?: string;
}

export const getWidgets = async (
  workspaceId: string,
  pageNum: number,
  pageSize: number,
  query?: string,
  type?: WidgetType
) => {
  let url = `/api/v1/workspaces/${workspaceId}/widgets?pageSize=${pageSize}&pageNumber=${pageNum}`;
  if (query) {
    url += `&query=${encodeURIComponent(query)}`;
  }
  if (type) {
    url += `&type=${type}`;
  }
  const response = await axios.get(url, { withCredentials: true });
  return response.data as WidgetData[];
};

export const getWidget = async (workspaceId: string, widgetId: string) => {
  const response = await axios.get(
    `/api/v1/workspaces/${workspaceId}/widgets/${widgetId}`,
    { withCredentials: true }
  );
  return response.data as WidgetData;
};

export const createWidget = async (workspaceId: string, data: CreateWidgetData) => {
  const response = await axios.post(
    `/api/v1/workspaces/${workspaceId}/widgets`,
    data
  );
  return response.data as WidgetData;
};

export const updateWidget = async (workspaceId: string, data: UpdateWidgetData) => {
  const response = await axios.put(
    `/api/v1/workspaces/${workspaceId}/widgets/${data.id}`,
    data
  );
  return response.data as WidgetData;
};

export const deleteWidget = async (workspaceId: string, id: string) => {
  const response = await axios.delete(
    `/api/v1/workspaces/${workspaceId}/widgets/${id}`
  );
  return response.data;
};