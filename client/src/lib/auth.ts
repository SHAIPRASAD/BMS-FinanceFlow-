export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("authToken");
  return token
    ? {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }
    : {
        "Content-Type": "application/json",
      };
}

export function isAuthError(error: Error): boolean {
  return /^(401|403): /.test(error.message);
}
