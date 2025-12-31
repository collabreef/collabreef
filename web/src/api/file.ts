import axios from "axios";

export interface FileInfo {
    id: string;
    name: string;
    original_name: string;
    size: number;
    ext: string;
    created_at: string;
    updated_at: string;
}

export const uploadFile = async (
    workspaceId: string,
    file: File,
    onUploadProgress?: (progressPercent: number) => void
) => {
    const formData = new FormData();
    formData.append("file", file)
    const response = await axios.post(`/api/v1/workspaces/${workspaceId}/files`, formData, {
        withCredentials: true,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
            if (onUploadProgress && progressEvent.total) {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onUploadProgress(percentCompleted);
            }
        },
    });
    return response.data;
};

export const listFiles = async (
    workspaceId: string,
    query?: string,
    ext?: string,
    pageSize?: number,
    pageNumber?: number
): Promise<{ files: FileInfo[] }> => {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (ext) params.append('ext', ext);
    if (pageSize) params.append('pageSize', pageSize.toString());
    if (pageNumber) params.append('pageNumber', pageNumber.toString());

    const response = await axios.get(`/api/v1/workspaces/${workspaceId}/files?${params.toString()}`, {
        withCredentials: true,
    });
    return response.data;
};

export const deleteFile = async (workspaceId: string, fileId: string) => {
    const response = await axios.delete(`/api/v1/workspaces/${workspaceId}/files/${fileId}`, {
        withCredentials: true,
    });
    return response.data;
};

export const renameFile = async (workspaceId: string, fileId: string, originalFilename: string) => {
    const response = await axios.patch(`/api/v1/workspaces/${workspaceId}/files/${fileId}`, {
        original_filename: originalFilename,
    }, {
        withCredentials: true,
    });
    return response.data;
};

export const getFileDownloadUrl = (workspaceId: string, fileName: string) => {
    return `/api/v1/workspaces/${workspaceId}/files/${fileName}`;
};
