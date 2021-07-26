// import { useRef, useState } from "react";

import Slider from "@material-ui/core/Slider";
import { useEffect, useState } from "react";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";
import StopIcon from "@material-ui/icons/Stop";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
interface PreviewPanelProps {
    playPreview: Function;
    pausePreview: Function;
    stopPreview: Function;
    disablePreview: boolean;
    audioSrc: any;
    isRecording: boolean;
    audioRef: React.Ref<HTMLAudioElement>;
    currentWorkspace: any;
    timeRange: number[];
    midiInformation: any;
    addCommentToWorkspace: Function;
}

const PreviewPanel = ({
    playPreview,
    pausePreview,
    stopPreview,
    disablePreview,
    audioSrc,
    isRecording,
    audioRef,
    currentWorkspace,
    timeRange,
    midiInformation,
    addCommentToWorkspace,
}: PreviewPanelProps) => {
    const [commentText, setCommentText] = useState<string>("");
    const [time, setTime] = useState<number[]>([timeRange[0], timeRange[1]]);

    useEffect(() => {
        setTime([timeRange[0], timeRange[1]]);
    }, [timeRange]);

    const onSubmitCommentClick = () => {
        if (currentWorkspace === false) return;
        addCommentToWorkspace(currentWorkspace.id, commentText, time);
        setCommentText("");
    };

    return (
        <div style={{ margin: "16px" }}>
            <Paper elevation={2} style={{ padding: "1em", minWidth: "50vw" }}>
                <Grid container justifyContent="space-between" spacing={1} alignItems="center" direction="column">
                    <Grid
                        container
                        justifyContent="center"
                        spacing={1}
                        alignItems="center"
                        direction="row"
                        style={{ padding: "16px" }}
                    >
                        <Grid item key={0}>
                            <IconButton onClick={() => playPreview()} disabled={disablePreview}>
                                <PlayArrowIcon color={disablePreview ? "disabled" : "secondary"} />
                            </IconButton>
                        </Grid>
                        <Grid item key={1}>
                            {/* {pause button currently ineffective when when pause & resuming; player starts back at config.startime instead} */}

                            <IconButton onClick={() => pausePreview()} disabled={disablePreview}>
                                <PauseIcon color={disablePreview ? "disabled" : "secondary"} />
                            </IconButton>
                        </Grid>
                        <Grid item key={2}>
                            <IconButton onClick={() => stopPreview()} disabled={disablePreview}>
                                <StopIcon color={disablePreview ? "disabled" : "secondary"} />
                            </IconButton>
                        </Grid>
                    </Grid>
                    <br />
                    <div>
                        {/* might have to change this approach as buffering issues are causing delay/problems in Chrome */}
                        {/* or implement the player something like this */}
                        {/* {https://letsbuildui.dev/articles/building-an-audio-player-with-react-hooks} */}
                        {audioSrc && !isRecording ? (
                            <div>
                                <div>
                                    <audio controls ref={audioRef}>
                                        <source src={audioSrc as string} type="audio/ogg" />
                                    </audio>
                                </div>
                                <TextField
                                    id="comment"
                                    label="Add comment"
                                    variant="outlined"
                                    required
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    style={{ margin: "4px" }}
                                />
                                <Slider
                                    value={[time[0], time[1]]}
                                    color="secondary"
                                    min={0}
                                    max={midiInformation.totalLength}
                                    onChange={(_, newRange) => setTime(newRange as number[])}
                                    valueLabelDisplay="auto"
                                />
                                <Typography variant="subtitle2">{"Time: " + time[0] + ", " + time[1]}</Typography>
                                <Button
                                    variant="contained"
                                    disabled={!currentWorkspace || commentText.length <= 0}
                                    onClick={() => onSubmitCommentClick()}
                                >
                                    Add Comment
                                </Button>
                            </div>
                        ) : null}
                    </div>
                </Grid>
            </Paper>
        </div>
    );
};

export { PreviewPanel };
