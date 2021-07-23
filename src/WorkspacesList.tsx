// import { useRef, useState } from "react";

interface WorkspacesListProps {
    allWorkspaces: any[];
    changeWorkspaceTo: Function;
}

interface CreateWorkspaceButtonProps {
    canCreateWorkspace : boolean,
    onCreateWorkspace : Function
}

const CreateWorkspaceButton = ({canCreateWorkspace, onCreateWorkspace} : CreateWorkspaceButtonProps) => {
    return (
        <div>
            <div style={{ margin: "16px" }}>
                <button disabled={!canCreateWorkspace} onClick={() => onCreateWorkspace()}>
                    Create New Workspace
                </button>
            </div>
        </div>
    );
};

const WorkspacesList = ({ allWorkspaces, changeWorkspaceTo }: WorkspacesListProps) => {
    return (
        <div style={{ margin: "16px" }}>
            <h4>All Workspaces:</h4>
            {
                <ul>
                    {allWorkspaces.map((workspace) => {
                        return (
                            <li
                                key={workspace.id}
                                style={{ cursor: "pointer" }}
                                onClick={() => changeWorkspaceTo(workspace.id)}
                            >
                                {workspace.name}
                            </li>
                        );
                    })}
                </ul>
            }
        </div>
    );
};

export { WorkspacesList, CreateWorkspaceButton };
