import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: Role;
  }
}

// @auth/core's callback signatures import JWT from "@auth/core/jwt" directly
// (not from the "next-auth/jwt" re-export barrel), so that's the module
// whose declaration merging actually reaches auth.ts's jwt() callback.
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
