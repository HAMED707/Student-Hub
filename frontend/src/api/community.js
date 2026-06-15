import { apiJson } from "./client.js";

export const fetchGroups = () => apiJson("/api/community/groups/");
export const fetchMyGroups = () => apiJson("/api/community/groups/my/");
export const fetchGroupDetail = (id) => apiJson(`/api/community/groups/${id}/`);
export const fetchPosts = (groupId) => apiJson(`/api/community/posts/?group=${groupId}`);
export const fetchGroupChats = () => apiJson("/api/community/chats/");
export const fetchGroupMessages = (groupId) =>
  apiJson(`/api/community/groups/${groupId}/messages/`);
export const markGroupMessagesRead = (groupId) =>
  apiJson(`/api/community/groups/${groupId}/messages/read/`, { method: "POST" });
export const sendGroupMessage = (groupId, body) =>
  apiJson(`/api/community/groups/${groupId}/messages/`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
export const createPost = ({ group, title, content, image }) => {
  const body = new FormData();
  body.append("group", group);
  if (title) body.append("title", title);
  body.append("content", content);
  if (image) body.append("image", image);

  return apiJson("/api/community/posts/create/", {
    method: "POST",
    body,
  });
};
export const createGroup = (payload) =>
  apiJson("/api/community/groups/create/", {
    method: "POST",
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
  });
export const joinGroup = (groupId) =>
  apiJson(`/api/community/groups/${groupId}/join/`, { method: "POST" });
export const leaveGroup = (groupId) =>
  apiJson(`/api/community/groups/${groupId}/leave/`, { method: "POST" });
export const votePost = (postId, value) =>
  apiJson(`/api/community/posts/${postId}/vote/`, {
    method: "POST",
    body: JSON.stringify({ value }),
  });
export const fetchComments = (postId) =>
  apiJson(`/api/community/posts/${postId}/comments/`);
export const createComment = (postId, text) =>
  apiJson(`/api/community/posts/${postId}/comments/`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
