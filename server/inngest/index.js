import { Inngest } from "inngest";
import prisma from "../configs/prisma.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "project-management" });


//inngest function to save userdaya to a database

const syncUserCreation=inngest.createFunction(
    {id: 'sync-user-from-clerk'},
    {event:'cleark/user.created'},
    async({ event })=>{
        const{data}=event
        await prisma.user.create({
             data: {
                id: data.id,
                email:data?.email_addresses[0]?.email_address,
                name: data?.first_name + " "+data?.last_name,
                image: data?.image_url,
            }
        })
        
    }
)

//inngest function to save user deletion to a database

const syncUserDeletion=inngest.createFunction(
    {id: 'delete-user-from-clerk'},
    {event:'clerk/user.deleted'},
    async({ event })=>{
        const{data}=event
        await prisma.user.delete({
             where: {
                id: data.id,
            
            }
        })
        
    }
)

//inngest function to Update User data

const syncUserUpdation=inngest.createFunction(
    {id: 'update-user-from-clerk'},
    {event:'clerk/user.updated'},
    async({ event })=>{
        const{data}=event
        await prisma.user.update({
            where: {
                id: data.id
            },
            data: {
                email:data?.email_addresses[0]?.email_addres,
                name: data?.first_name + " "+data?.last_name,
                image: data?.image_url,
            }
        })
        
    }
)

<<<<<<< HEAD
// Inngest function to save workspace data to a database
const syncWorkspaceCreation = inngest.createFunction(
  { id: "sync-workspace-from-clerk" },
  { event: "clerk/organization.created" },
  async ({ event }) => {
    const { data } = event;
    await prisma.workspace.create({
        data: { 
            id: data.id,
            name: data.name,
            slug: data.slug,
            ownerId: data.owner_id,
            image_url: data.image_url || null,
            },
    });
//Add creator as ADMIN member
    await prisma.workspaceMember.create({
        data: {
            userId: data.created_by,
            workspaceId: data.id,
            role: "ADMIN",
        },
    });     
  }
);

//Inngest Functions to Update workspace data in database on update and delete events can be added similarly
const syncWorkspaceUpdation = inngest.createFunction(
  { id: "update-workspace-from-clerk" },
  { event: "clerk/organization.updated" },
  async ({ event }) => {
    const { data } = event;
    await prisma.workspace.update({
        where: { id: data.id },
        data: { name: data.name, slug: data.slug, image_url: data.image_url || null },
    });
  }
  )

  //inngest function to delete workspace from database on deletion event
const syncWorkspaceDeletion = inngest.createFunction(
  { id: "delete-workspace-from-clerk" }, 
  { event: "clerk/organization.deleted" },
  async ({ event }) => {
    const { data } = event;
    await prisma.workspace.delete({
        where: { id: data.id },
    });
  }
);

//inngest function to save workspace member data to database on member addition event
const syncWorkspaceMemberAddition = inngest.createFunction(
  { id: "add-workspace-member-from-clerk" },
    { event: "clerk/organization_member.created" },
    async ({ event }) => {
      const { data } = event;
      await prisma.workspaceMember.create({
        data: {
          userId: data.user_id,
          workspaceId: data.organization_id,
          role: String(data.role_name).toUpperCase(), // Ensure role is in uppercase
        },
      });
    }
);

// Export functions list so your deployment entrypoint / build can import them
export const functions = [
    syncUserCreation, 
    syncUserDeletion, 
    syncUserUpdation, 
    syncWorkspaceCreation, 
    syncWorkspaceUpdation, 
    syncWorkspaceDeletion, 
    syncWorkspaceMemberAddition
=======



// Create an empty array where we'll export future Inngest functions
export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation
>>>>>>> parent of 2dc6962 (inngest-update)
];