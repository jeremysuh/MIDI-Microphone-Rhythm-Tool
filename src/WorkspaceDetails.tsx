// import { useRef, useState } from "react";

import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import Fab from "@material-ui/core/Fab";
import AddIcon from "@material-ui/icons/Add";

interface CreateWorkspaceButtonProps {
    canCreateWorkspace: boolean;
    onCreateWorkspace: Function;
}

const CreateWorkspaceButton = ({ canCreateWorkspace, onCreateWorkspace }: CreateWorkspaceButtonProps) => {
    const fabStyle = {
        // margin: 0,
        // top: "auto",
        // right: 20,
        // bottom: 20,
        // left: "auto",
        // position: "fixed",
    };

    return (
        <div>
            <Fab
                variant="extended"
                color="primary"
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

interface WorkspaceDetailsProps {
    currentWorkspace: any | null;
    canCreateWorkspace: boolean;
    onCreateWorkspace: Function;
}

const WorkspaceDetails = ({ currentWorkspace, canCreateWorkspace, onCreateWorkspace }: WorkspaceDetailsProps) => {
    return (
        <div>
            <Paper elevation={2} style={{ padding: "2em", minWidth: "50vw" }}>
                <Grid container justifyContent="space-between" spacing={1} alignItems="center" direction="column">
                    {currentWorkspace ? (
                        <Typography variant="h5" style={{ margin: "4px" }} color="primary">
                            {currentWorkspace.name}
                        </Typography>
                    ) : (
                        <div>
                            <CreateWorkspaceButton
                                canCreateWorkspace={canCreateWorkspace}
                                onCreateWorkspace={onCreateWorkspace}
                            />
                        </div>
                    )}

                    {currentWorkspace
                        ? currentWorkspace.comments.map((comment: any) => {
                              return (
                                  <div>
                                      <div>Times:{comment.time[0] + " , " + comment.time[1]}</div>
                                      <div>Text: {comment.text}</div>
                                  </div>
                              );
                          })
                        : null}
                </Grid>
            </Paper>
        </div>
    );
};

export { WorkspaceDetails };
