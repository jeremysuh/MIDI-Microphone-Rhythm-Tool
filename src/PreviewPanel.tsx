// import { useRef, useState } from "react";

//import Slider from "@material-ui/core/Slider";
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
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";

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
    seekPreview: Function;
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
    seekPreview,
}: PreviewPanelProps) => {
    const [commentText, setCommentText] = useState<string>("");
    const [time, setTime] = useState<number[]>([timeRange[0], timeRange[1]]);
    const [expanded, setExpanded] = useState<boolean>(true);
    useEffect(() => {
        setTime([timeRange[0], timeRange[1]]);
    }, [timeRange]);

    const onSubmitCommentClick = () => {
        if (currentWorkspace === false) return;
        addCommentToWorkspace(currentWorkspace.id, commentText, time);
        setCommentText("");
    };

    if (isRecording) return null;

    return (
        <div style={{ margin: "16px", minWidth: "30vw" }}>
            <Accordion expanded={expanded} onChange={() => setExpanded((v) => !v)}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="panel1a-header">
                    <Typography>Recording Preview</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container justifyContent="space-between" spacing={1} alignItems="center" direction="column">
                        {/* <Grid item key={0}>
                        <Typography variant="h6">Preview</Typography>
                    </Grid> */}

                        <Grid item key={1}>
                            <Paper elevation={5}>
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
                            </Paper>
                        </Grid>
                        <Grid item key={2}>
                            <div>
                                {/* might have to change this approach as buffering issues are causing delay/problems in Chrome */}
                                {/* or implement the player something like this */}
                                {/* {https://letsbuildui.dev/articles/building-an-audio-player-with-react-hooks} */}
                                {audioSrc && !isRecording ? (
                                    <div>
                                        <div>
                                            {/* will probs have to make an overlay over the audio element for seeking */}
                                            <audio controls ref={audioRef} hidden>
                                                <source src={audioSrc as string} type="audio/ogg" />
                                            </audio>
                                        </div>
                                        {/* <Slider
                                                value={[time[0], time[1]]}
                                                color="secondary"
                                                min={timeRange[0]}
                                                max={Math.round(timeRange[1] * 10) / 10} //round to 1 decimal place
                                                step={0.1}
                                                onChange={(_, newRange) => setTime(newRange as number[])}
                                                valueLabelDisplay="auto"
                                                style={{ minWidth: "15vw" }}
                                            /> */}
                                        {/* will hide above until a working scrubbable player is made */}
                                        <Grid
                                            container
                                            justifyContent="space-between"
                                            spacing={1}
                                            alignItems="center"
                                            direction="row"
                                        >
                                            <Grid item key={0}>
                                                <Typography variant="subtitle2">
                                                    Start: {Number(time[0]).toFixed(2)}s
                                                </Typography>
                                            </Grid>
                                            <Grid item key={1}>
                                                <Typography variant="subtitle2">
                                                    End: {Number(time[1]).toFixed(2)}s
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </div>
                                ) : null}
                            </div>
                        </Grid>
                        <Grid item key={3}>
                            <TextField
                                id="comment"
                                variant="outlined"
                                required
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                style={{ margin: "4px" }}
                            />
                        </Grid>
                        <Grid item key={4}>
                            <Button
                                variant="contained"
                                disabled={!currentWorkspace || commentText.length <= 0}
                                onClick={() => onSubmitCommentClick()}
                            >
                                Add Comment
                            </Button>
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>
        </div>
    );
};

export { PreviewPanel };
