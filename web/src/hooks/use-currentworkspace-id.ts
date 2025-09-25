import { useParams } from "react-router-dom";

const useCurrentWorkspaceId = () => {
  const { workspaceId } = useParams<{ workspaceId?: string }>();

  const effectiveId = workspaceId;
  if (!effectiveId) {
    throw new Error("No workspaceId found");
  }
  return effectiveId;
}

export default useCurrentWorkspaceId
