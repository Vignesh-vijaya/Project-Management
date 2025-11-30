import { Inngest } from "inngest";
import prisma from "../configs/prisma.js";

// Create a client to send and receive events (must match your Inngest App id)
export const inngest = new Inngest({ id: "project-management" });

/**
 * Helper to safely get primary email from Clerk event payload
 */
const getPrimaryEmail = (data) => {
  try {
    return data?.email_addresses?.[0]?.email_address ?? null;
  } catch (e) {
    return null;
  }
};

/**
 * sync user creation
 * NOTE: event name must exactly match the one in Events -> clerk/user.created
 */
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" }, // fixed typo
  async ({ event }) => {
    console.log("syncUserCreation | received event:", event.name);
    const { data } = event;
    try {
      const user = await prisma.user.create({
        data: {
          id: data.id,
          email: getPrimaryEmail(data) ?? `clerk-${data.id}@example.com`,
          name: `${data?.first_name ?? ""} ${data?.last_name ?? ""}`.trim(),
          image: data?.image_url ?? "",
        },
      });
      console.log("syncUserCreation | created user:", user.id);
    } catch (err) {
      // log and rethrow if you want Inngest to surface a failed run
      console.error("syncUserCreation | error:", err);
      throw err;
    }
  }
);

/**
 * sync user deletion
 */
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-from-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    console.log("syncUserDeletion | received event:", event.name);
    const { data } = event;
    try {
      await prisma.user.delete({ where: { id: data.id } });
      console.log("syncUserDeletion | deleted user:", data.id);
    } catch (err) {
      console.error("syncUserDeletion | error:", err);
      // If user might not exist, you can ignore NotFound errors:
      // if (err?.code === 'P2025') { console.warn('not found'); return; }
      throw err;
    }
  }
);

/**
 * sync user update
 */
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    console.log("syncUserUpdation | received event:", event.name);
    const { data } = event;
    try {
      const upd = await prisma.user.update({
        where: { id: data.id },
        data: {
          email: getPrimaryEmail(data),
          name: `${data?.first_name ?? ""} ${data?.last_name ?? ""}`.trim(),
          image: data?.image_url ?? "",
        },
      });
      console.log("syncUserUpdation | updated user:", upd.id);
    } catch (err) {
      console.error("syncUserUpdation | error:", err);
      throw err;
    }
  }
);

// Export functions list so your deployment entrypoint / build can import them
export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation];
