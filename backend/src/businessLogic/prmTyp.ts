export interface UserPermission {
    status: boolean;
    reason?: "NOT_FOUND" | "UNAUTHORIZED"
}