// import { useRef, useState } from "react";

import Fab from "@material-ui/core/Fab";
import Typography from "@material-ui/core/Typography";
import AddIcon from "@material-ui/icons/Add";

interface WorkspacesListProps {
    allWorkspaces: any[];
    changeWorkspaceTo: Function;
    loadedMidiMetaData: MidiMetaData | null;
}

interface CreateWorkspaceButtonProps {
    canCreateWorkspace: boolean;
    onCreateWorkspace: Function;
}

type MidiMetaData = {
    name: string | null;
    key: string;
    scale: string;
    ppq: number;
    ticksCount: number;
    tracksCount: number;
    bpm: number;
};

const CreateWorkspaceButton = ({ canCreateWorkspace, onCreateWorkspace }: CreateWorkspaceButtonProps) => {
    const fabStyle = {
        margin: 0,
        top: "auto",
        right: 20,
        bottom: 20,
        left: "auto",
        position: "fixed",
    };

    return (
        <div>
            <Fab
                variant="extended"
                color="secondary"
                aria-label="add"
                disabled={!canCreateWorkspace}
                onClick={() => onCreateWorkspace()}
                style={fabStyle as any}
            >
                <AddIcon style={{ marginRight: "4px" }} />
                <Typography style={{ marginLeft: "4px", marginRight: "4px" }}>Create Workspace</Typography>
            </Fab>
        </div>
    );
};

const WorkspacesList = ({ allWorkspaces, changeWorkspaceTo, loadedMidiMetaData }: WorkspacesListProps) => {
    const matchesLoadedMidiMetaData = (midiMetaData: MidiMetaData): boolean => {
        if (loadedMidiMetaData === null) return false;
        return (
            loadedMidiMetaData.bpm === midiMetaData.bpm &&
            loadedMidiMetaData.key === midiMetaData.key &&
            loadedMidiMetaData.name === midiMetaData.name &&
            loadedMidiMetaData.ppq === midiMetaData.ppq &&
            loadedMidiMetaData.scale === midiMetaData.scale &&
            loadedMidiMetaData.ticksCount === midiMetaData.ticksCount &&
            loadedMidiMetaData.tracksCount === midiMetaData.tracksCount
        );
    };

    return (
        <div style={{ margin: "16px" }}>
            <h4>All Workspaces:</h4>
            {
                <ul>
                    {allWorkspaces.map((workspace) => {
                        return (
                            <li key={workspace.id} style={{ cursor: "pointer" }}>
                                <button
                                    onClick={() => changeWorkspaceTo(workspace.id)}
                                    disabled={matchesLoadedMidiMetaData(workspace.midiMetaData) === false}
                                >
                                    {workspace.name}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            }
        </div>
    );
};

export { WorkspacesList, CreateWorkspaceButton };
