import type { FastifyReply, FastifyRequest } from "fastify";

export enum UserRole {
  ADMIN = "admin",
  SELLER = "seller",
  CLIENT = "client",
}

export interface AuthenticatedUser {
  id: number;
  role?: string;
  email?: string;
  username?: string;
}

export interface AuthenticatedRequest extends FastifyRequest {
  user: AuthenticatedUser;
}

export const requireRole = (allowedRoles: UserRole[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.user || !request.user.id) {
        return reply.code(401).send({
          error: "Authentication required",
          message: "You must be logged in to access this resource.",
        });
      }

      if (!request.user.role) {
        return reply.code(401).send({
          error: "Invalid authentication",
          message: "User role information is missing.",
        });
      }

      if (!allowedRoles.includes(request.user.role as UserRole)) {
        return reply.code(403).send({
          error: "Forbidden",
          message: `Access denied. Required role(s): ${allowedRoles.join(", ")}. Your role: ${request.user.role}`,
        });
      }
    } catch (err) {
      console.error("Role verification error:", err);
      return reply.code(500).send({
        error: "Internal server error",
        message: "An error occurred while verifying user role.",
      });
    }
  };
};

export const requireAdmin = requireRole([UserRole.ADMIN]);

export const requireSeller = requireRole([UserRole.SELLER]);

export const requireClient = requireRole([UserRole.CLIENT]);

export const requireSellerOrAdmin = requireRole([UserRole.SELLER, UserRole.ADMIN]);
