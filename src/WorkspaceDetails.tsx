// import { useRef, useState } from "react";

import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";

interface WorkspaceDetailsProps {
    currentWorkspace: any | null;
}

const WorkspaceDetails = ({ currentWorkspace }: WorkspaceDetailsProps) => {
    return (
        <div>
            <Paper elevation={2} style={{ padding: "1em", minWidth: "50vw" }}>
                <Grid container justifyContent="space-between" spacing={1} alignItems="center" direction="column">
            <Typography variant="h5" style={{ margin: "4px" }}  color="secondary">Current Workspace:</Typography>
            <Typography variant="h5" style={{ margin: "4px" }}  color="primary">{currentWorkspace ? currentWorkspace.name : "-"}</Typography>

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
