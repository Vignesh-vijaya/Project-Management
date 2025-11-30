import express from 'express';
import { addMemberToWorkspace,getUserWorkspaces} from '../controllers/workspaceController.js'; 


const workspaceRouter = express.Router();
// Route to get all workspaces for a user
workspaceRouter.get('/', getUserWorkspaces);
workspaceRouter.post('/add-member', addMemberToWorkspace);


export default workspaceRouter;