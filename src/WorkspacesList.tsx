// import { useRef, useState } from "react";

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
