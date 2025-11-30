export const getUserWorkspaces = async (req, res) => {
  try {
    // 1. In Express w/ Clerk, req.auth is an object, not a function.
    const { userId } = req.auth; 

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 2. Query 'workspace' directly, not 'workspaceMember'.
    // We filter workspaces where 'members' contains the current userId.
    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      // 3. Fix nesting structure and field names
      include: {
        members: {
          include: {
            user: true,
          },
        },
        projects: {
          include: {
            tasks: {
              include: {
                assignee: true,
                comments: { // Schema uses lowercase 'comments'
                  include: {
                    user: true,
                  },
                },
              },
            },
            members: {
              include: {
                user: true,
              },
            },
          },
        },
        owner: true,
      },
    });

    res.json({ workspaces });
  } catch (error) {
    console.error("Error fetching user workspaces:", error);
    res.status(500).json({ error: "Failed to fetch workspaces" });
  }
};

//add member to workspace
export const addMemberToWorkspace = async (req, res) => {
  try {
         const { userId } = req.auth;
         const {email, workspaceId, role,message} = req.body;
            //check if user with email exists
            const user = await prisma.user.findUnique({
                where: { email: email },
            });
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
            if (!workspaceId || !role) {
                return res.status(400).json({ error: "workspaceId and role are required" });
            }   
            if (!['ADMIN', 'MEMBER'].includes(role)) {
                return res.status(400).json({ error: "Invalid role specified" });
            }   
            //fetch workspace to check if requester is ADMIN
            const workspace = await prisma.workspace.findUnique({
                where: { id: workspaceId },
                include: {members: true}});
            if (!workspace) {
                return res.status(404).json({ error: "Workspace not found" });
            }
            // Check if the requester is an ADMIN in the workspace
            const requesterMember = workspace.members.find(member => member.userId === userId);
            if (!requesterMember || requesterMember.role !== 'ADMIN') {
                return res.status(403).json({ error: "Only ADMINs can add members to the workspace" });
            }

            //check if user is already a member
            const existingMember = await prisma.workspaceMember.findUnique({
                where: {
                    workspaceId_userId: {  
                        workspaceId: workspaceId,
                        userId: user.id,
                    },
                },
            });
            if (existingMember) {
                return res.status(400).json({ error: "User is already a member of the workspace" });
            }
            const member = await prisma.workspaceMember.create({
                data: {
                    userId: user.id,
                    workspaceId: workspaceId,
                    role: role,
                    message: message || null,
                },
            });
            res.json({ member,message: "Member added successfully"
                });;

     }catch (error) {
    console.error("Error fetching user workspaces:", error);
    res.status(500).json({ error: "Failed to fetch workspaces" });
  }
};
