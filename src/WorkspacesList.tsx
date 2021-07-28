// import { useRef, useState } from "react";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import ListAltIcon from '@material-ui/icons/ListAlt';
interface WorkspacesListProps {
    allWorkspaces: any[];
    changeWorkspaceTo: Function;
    loadedMidiMetaData: MidiMetaData | null;
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
                 <Grid container justifyContent="space-between" spacing={1} alignItems="center" direction="column">
            <Typography variant="h6">All Workspaces:</Typography>
            {
                <List>
                    {allWorkspaces.map((workspace) => {
                        return (
                            <ListItem
                                key={workspace.id}
                                style={{ cursor: "pointer"}}
                                onClick={() => changeWorkspaceTo(workspace.id)}
                                disabled={matchesLoadedMidiMetaData(workspace.midiMetaData) === false}
                            >
                                <Button variant="contained"color="primary" style={{minWidth: "32vw"}} startIcon={<ListAltIcon />}>{workspace.name}</Button>
                             </ListItem>
                        );
                    })}
                </List>
            }
            </Grid>
         </div>
    );
};

export { WorkspacesList };
