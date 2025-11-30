// prisma-test.js
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ log: ['query', 'warn', 'error'] });

async function main() {
  console.log("---- START TEST ----");

  // 1) Create dummy user
  const user = await prisma.user.create({
    data: {
      id: "user_test_1",              // your schema requires manual id
      name: "Dummy User",
      email: "dummy@example.com",
      image: ""
    }
  });
  console.log("User created:", user);

  // 2) Create dummy workspace
  const ws = await prisma.workspace.create({
    data: {
      id: "ws_test_1",
      name: "Dummy Workspace",
      slug: "dummy-workspace",
      ownerId: user.id
    }
  });
  console.log("Workspace created:", ws);

  // 3) Add user as workspace member
  const wsMember = await prisma.workspaceMember.create({
    data: {
      userId: user.id,
      workspaceId: ws.id,
      role: "ADMIN"
    }
  });
  console.log("WorkspaceMember created:", wsMember);

  // 4) Create dummy project
  const project = await prisma.project.create({
    data: {
      name: "Dummy Project",
      team_lead: user.id,
      workspaceId: ws.id
    }
  });
  console.log("Project created:", project);

  // 5) Add Project Member
  await prisma.projectMember.create({
    data: {
      userId: user.id,
      projectId: project.id
    }
  });
  console.log("ProjectMember created");

  // 6) Create dummy task
  const task = await prisma.task.create({
    data: {
      projectId: project.id,
      title: "Dummy Task",
      assigneeId: user.id,
      due_date: new Date(Date.now() + 86400000) // tomorrow
    }
  });
  console.log("Task created:", task);

  console.log("---- ALL DONE ----");
}

main()
  .catch(err => console.error("ERROR:", err))
  .finally(async () => await prisma.$disconnect());
