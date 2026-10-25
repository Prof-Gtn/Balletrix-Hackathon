// The three account types in profiles.role. Admins are set in Supabase, never chosen at sign-up.
export type Role = "entrepreneur" | "investor" | "admin";

export function toRole(value: unknown): Role {
  return value === "investor" || value === "admin" ? value : "entrepreneur";
}

// Where each role lands after signing in, and where pages for another role send them.
export const HOME: Record<Role, string> = {
  entrepreneur: "/dashboard",
  investor: "/investor/dashboard",
  admin: "/admin/dashboard",
};
