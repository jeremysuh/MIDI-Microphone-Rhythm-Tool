import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import Fab from "@material-ui/core/Fab";
import AddIcon from "@material-ui/icons/Add";
import ListItem from "@material-ui/core/ListItem";
import List from "@material-ui/core/List";
import Button from "@material-ui/core/Button";
import CommentIcon from "@material-ui/icons/Comment";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import SaveIcon from "@material-ui/icons/Save";

import { useState } from "react";
import TextField from "@material-ui/core/TextField";

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
    selectComment: Function;
    deleteComment: Function;
    editComment: Function;
    selectedComment: any;
    config: any;
    addCommentToWorkspace: Function;
}

const WorkspaceDetails = ({
    currentWorkspace,
    canCreateWorkspace,
    onCreateWorkspace,
    selectComment,
    deleteComment,
    editComment,
    selectedComment,
    addCommentToWorkspace, 
    config,
}: WorkspaceDetailsProps) => {
    const [editModeOn, setEditModeOn] = useState<boolean>(false);
    const [editTextValue, setEditTextValue] = useState<string>("");
    const [commentText, setCommentText] = useState<string>("");

    return (
        <div>
            <Paper elevation={2} style={{ padding: "2em", minWidth: "50vw" }}>
                <Grid container justifyContent="space-between" spacing={2} alignItems="center" direction="column">
                    <Grid item key={0}>
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
                    </Grid>
                    <Grid item key={1}>
                        {currentWorkspace ? (
                            <List
                                style={{
                                    overflow: "scroll",
                                    maxWidth: "50vw",
                                    flexDirection: "row",
                                    display: "flex",
                                    overflowY: "hidden",
                                }}
                            >
                                {currentWorkspace.comments.map((comment: any) => {
                                    return (
                                        <ListItem style={{ cursor: "pointer" }}>
                                            <Grid
                                                container
                                                justifyContent="space-around"
                                                spacing={1}
                                                alignItems="center"
                                                direction="row"
                                            >
                                                <Grid item key={0}>
                                                    <Button
                                                        variant="contained"
                                                        color={
                                                            selectedComment && selectedComment.id === comment.id
                                                                ? "primary"
                                                                : "secondary"
                                                        }
                                                        startIcon={<CommentIcon />}
                                                        onClick={() => {
                                                            if (selectedComment && selectedComment.id === comment.id) {
                                                                selectComment("");
                                                                return; //deselect
                                                            }
                                                            selectComment(comment.id);
                                                        }}
                                                    >
                                                        {`${Number(comment.time[0]).toFixed(2)}s - ${Number(
                                                            comment.time[1]
                                                        ).toFixed(2)}s`}
                                                    </Button>
                                                </Grid>
                                            </Grid>
                                        </ListItem>
                                    );
                                })}
                            </List>
                        ) : null}
                    </Grid>

                    <Grid item key={3}>
                        {currentWorkspace && currentWorkspace.comments.length === 0 ? (
                            <Typography variant="h5">No comments yet</Typography>
                        ) : null}
                        {selectedComment ? (
                            <div>
                                {editModeOn ? (
                                    <TextField
                                        id="outlined-basic"
                                        variant="outlined"
                                        defaultValue={selectedComment.text}
                                        onChange={(e) => setEditTextValue(e.target.value)}
                                    />
                                ) : (
                                    <Typography variant="h4">{selectedComment.text}</Typography>
                                )}

                                <IconButton
                                    aria-label="edit"
                                    onClick={() => {
                                        if (editModeOn) {
                                            editComment(selectedComment.id, currentWorkspace.id, editTextValue);
                                            setEditModeOn(false); //save text here
                                        } else {
                                            setEditTextValue(selectedComment.text);
                                            setEditModeOn(true);
                                        }
                                    }}
                                >
                                    {editModeOn ? <SaveIcon /> : <EditIcon />}
                                </IconButton>
                                <IconButton
                                    aria-label="delete"
                                    onClick={() => deleteComment(selectedComment.id, currentWorkspace.id)}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </div>
                        ) : null}
                    </Grid>

                    <Grid item key={4}>
                        {
                             currentWorkspace ?
                        <Paper elevation={3} style={{padding: "1em"}}>
                        <TextField
                            id="comment"
                            variant="outlined"
                            required
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            style={{ margin: "4px" }}
                        />
                        <Fab
                            variant="extended"
                            size="medium"
                            color="secondary"
                            aria-label="upload"
                            onClick={() => {
                                addCommentToWorkspace(currentWorkspace.id, commentText, [config.startTime, config.endTime])
                                setCommentText("")
                            }
                            }
                            disabled={!currentWorkspace || commentText.length === 0}
                        >
                            <AddIcon />
                            Add Comment
                        </Fab>
                        <br /> 
                        <Grid container justifyContent="center" spacing={1} alignItems="center" direction="column">
                            <Grid item key={0}>
                                <Typography variant="subtitle2">Comment for: {Number(config.startTime).toFixed(2)}s to {Number(config.endTime).toFixed(2)}s</Typography>
                            </Grid> 
                            <Grid item key={1}>

                            <Typography variant="subtitle1">Use track slider to adjust time</Typography>
                            </Grid> 

                        </Grid>
                        </Paper> : null
}
                    </Grid>
                </Grid>
            </Paper>
        </div>
    );
};

export { WorkspaceDetails };
