import { apiJson } from "./client.js";

export const fetchGroups = () => apiJson("/api/community/groups/");
export const fetchMyGroups = () => apiJson("/api/community/groups/my/");
export const fetchGroupDetail = (id) => apiJson(`/api/community/groups/${id}/`);
export const fetchPosts = (groupId) => apiJson(`/api/community/posts/?group=${groupId}`);
export const createPost = ({ group, content, image }) => {
  const body = new FormData();
  body.append("group", group);
  body.append("content", content);
  if (image) body.append("image", image);

  return apiJson("/api/community/posts/create/", {
    method: "POST",
    body,
  });
};
export const joinGroup = (groupId) =>
  apiJson(`/api/community/groups/${groupId}/join/`, { method: "POST" });
export const leaveGroup = (groupId) =>
  apiJson(`/api/community/groups/${groupId}/leave/`, { method: "POST" });
