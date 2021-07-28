// import { useRef, useState } from "react";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import "./MidiMicrophoneTool.css";
import { createStyles, Theme, makeStyles } from "@material-ui/core/styles";
import MicIcon from "@material-ui/icons/Mic";
import FiberManualRecordIcon from "@material-ui/icons/FiberManualRecord";
import StopIcon from "@material-ui/icons/Stop";
import Typography from "@material-ui/core/Typography";
import { useRef } from "react";
import { useAnimationFrame } from "./CustomHooks";
import Fab from "@material-ui/core/Fab";
import BackupIcon from "@material-ui/icons/Backup";
import Slider from "@material-ui/core/Slider";
import { useMemo } from "react";
var Rainbow = require("rainbowvis.js");

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        margin: {
            margin: theme.spacing(1),
        },
        extendedIcon: {
            marginRight: theme.spacing(1),
        },
    })
);

interface Note {
    time: number;
    velocity: number;
    duration: number;
}

interface TrackDetail {
    notes: Note[];
    maxVelocity: number;
}

interface MidiTrackPanelProps {
    soundFontLoaded: boolean;
    isRecording: boolean;
    isPreviewPlaying: boolean;
    midiLoaded: boolean;
    midiInformation: any;
    readMidiUri: Function;
    config: any;
    setConfig: Function;
    allowMicrophoneAccess: Function;
    hasMicrophoneAccess: boolean;
    startRecording: Function;
    stopRecording: Function;
    pointer: any;
    fileName: string | null;
    midiJSON: any;
}

const MidiTrackPanel = ({
    soundFontLoaded,
    isRecording,
    isPreviewPlaying,
    midiLoaded,
    midiInformation,
    readMidiUri,
    config,
    setConfig,
    allowMicrophoneAccess,
    hasMicrophoneAccess,
    startRecording,
    stopRecording,
    pointer,
    fileName,
    midiJSON,
}: MidiTrackPanelProps) => {
    const classes = useStyles();

    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const offset = useRef<number>(25);

    const canvasWidth = useRef<number>(800);
    const canvasHeight = useRef<number>(150);

    const trackWidth = useRef<number>(750);
    const trackHeight = useRef<number>(150);

    const rainbowColor = useRef<any>(new Rainbow());

    const trackDetail = useMemo(() => {
        if (!midiJSON) return null;

        if (midiJSON.tracks.length === 0) return null;

        const result: TrackDetail = {
            maxVelocity: 0,
            notes: [],
        };

        for (const track of midiJSON.tracks) {
            for (const note of track.notes) {
                result.maxVelocity = Math.max(note.velocity, result.maxVelocity);
                result.notes.push({
                    time: note.time,
                    velocity: note.velocity,
                    duration: note.duration,
                });
            }
        }

        console.log(result);

        return result;
    }, [midiJSON]);

    //const y = useRef<number>(0)

    useAnimationFrame(
        (delta: number) => {
            if (canvasRef.current === null) return;

            const ctx = canvasRef.current.getContext("2d");
            if (ctx === null || ctx === undefined) return;

            ctx.clearRect(0, 0, canvasWidth.current, canvasHeight.current);

            //ticker
            ctx.fillStyle = "indigo";
            ctx.fillRect(
                offset.current + (pointer.current / midiInformation.totalLength) * trackWidth.current,
                0,
                1,
                150
            );

            //main track line
            ctx.fillStyle = "black";
            ctx.fillRect(25, 74, 750, 2);

            //start range
            ctx.fillStyle = "rgba(155, 155, 155, 0.4)";
            ctx.fillRect(
                0,
                0,
                offset.current + (config.startTime / midiInformation.totalLength) * trackWidth.current,
                trackHeight.current
            );

            //end range
            ctx.fillStyle = "rgba(155, 155, 155, 0.4)";
            ctx.fillRect(
                canvasWidth.current -
                    offset.current -
                    ((midiInformation.totalLength - config.endTime) / midiInformation.totalLength) * trackWidth.current,
                0,
                offset.current +
                    ((midiInformation.totalLength - config.endTime) / midiInformation.totalLength) * trackWidth.current,
                trackHeight.current
            );

            //draw individiual notes
            if (trackDetail) {
                for (let note of trackDetail.notes) {
                    ctx.fillStyle = `#${rainbowColor.current.colourAt(
                        (note.time / midiInformation.totalLength) * 100
                    )}`;

                    const lineHeight = (note.velocity / trackDetail.maxVelocity) * (trackHeight.current - 50);
                    const yOffset = (trackHeight.current - lineHeight) / 2;

                    //some out of bounds drawing due to inconsistency with Tone.JS & MidiPlayerJS length determination
                    let xPos = offset.current + (note.time / midiInformation.totalLength) * trackWidth.current;
                    if (xPos > offset.current + trackWidth.current) xPos = offset.current + trackWidth.current;

                    ctx.fillRect(xPos, yOffset, 1, lineHeight);
                }
            } else {
                //blank template notes visual
                ctx.fillStyle = "grey";

                for (let i = 0; i < trackWidth.current; i += 10) {
                    const lineHeight = (trackHeight.current - 50) * Math.sin(i / 80);
                    const yOffset = (trackHeight.current - lineHeight) / 2;
                    ctx.fillRect(offset.current + i, yOffset, 1, lineHeight);
                }
            }
        },
        [canvasRef, midiLoaded, trackDetail]
    );

    return (
        <div style={{ margin: "1em" }}>
            <Paper elevation={2} style={{ padding: "1em", minWidth: "60vw" }}>
                <Grid container justifyContent="space-between" spacing={1} alignItems="center" direction="column">
                    <input
                        type="file"
                        accept="audio/midi, audio/mid"
                        id="midi-upload"
                        hidden
                        onChange={(event) => readMidiUri(event)}
                        disabled={!soundFontLoaded || isRecording || isPreviewPlaying}
                    ></input>

                    <label htmlFor="midi-upload" style={{ cursor: "pointer" }}>
                        <Fab
                            variant="extended"
                            size="medium"
                            color="secondary"
                            aria-label="upload"
                            style={{ pointerEvents: "none" }}
                            className={classes.margin}
                        >
                            <BackupIcon className={classes.extendedIcon} />
                            Upload MIDI
                        </Fab>
                    </label>

                    {fileName ? <Typography variant="subtitle2">{fileName}</Typography> : null}

                    <br />
                    <div style={{ margin: "1em" }}>
                        <canvas
                            id="canvas"
                            ref={canvasRef}
                            width="800px"
                            height="150px"
                            style={{ backgroundColor: "lightgrey" }}
                        ></canvas>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            flexDirection: "column",
                            alignItems: "center",
                            minWidth: "750px",
                        }}
                    >
                        <Slider
                            value={[config.startTime, config.endTime]}
                            defaultValue={[0, 0]}
                            color="primary"
                            min={0}
                            max={midiInformation.totalLength}
                            onChange={(_, newRange) => {
                                const range: number[] = newRange as number[];
                                setConfig({
                                    startTime: range[0],
                                    endTime: range[1],
                                });
                            }}
                            valueLabelDisplay="auto"
                        />
                        <Grid container justifyContent="space-between" spacing={1} alignItems="center" direction="row">
                            <Grid item key={0}>
                                <Typography variant="subtitle2">
                                    Start: {Number(config.startTime).toFixed(2)} s
                                </Typography>
                            </Grid>
                            <Grid item key={1}>
                                <Typography variant="subtitle2">End: {Number(config.endTime).toFixed(2)} s</Typography>
                            </Grid>
                        </Grid>
                    </div>
                    <br />
                    {!hasMicrophoneAccess ? (
                        <Fab
                            variant="extended"
                            size="medium"
                            color="secondary"
                            aria-label="upload"
                            className={classes.margin}
                            onClick={() => allowMicrophoneAccess()}
                            disabled={hasMicrophoneAccess}
                        >
                            <MicIcon
                                className={classes.extendedIcon}
                                color={hasMicrophoneAccess ? "disabled" : "inherit"}
                            />
                            Grant Microphone Permission
                        </Fab>
                    ) : null}
                    <br />
                    <br />
                    <Grid container justifyContent="center" spacing={1} alignItems="center" direction="row">
                        {!isRecording ? (
                            <Fab
                                variant="extended"
                                size="medium"
                                color="secondary"
                                aria-label="upload"
                                className={classes.margin}
                                onClick={() => startRecording()}
                                disabled={!midiLoaded || isRecording || !hasMicrophoneAccess}
                            >
                                <FiberManualRecordIcon className={classes.extendedIcon} />
                                Start Recording
                            </Fab>
                        ) : (
                            <Fab
                                variant="extended"
                                size="medium"
                                color="secondary"
                                aria-label="upload"
                                className={classes.margin}
                                onClick={() => stopRecording()}
                                disabled={!midiLoaded || !isRecording || !hasMicrophoneAccess}
                            >
                                <StopIcon className={classes.extendedIcon} />
                                Stop Recording
                            </Fab>
                        )}
                    </Grid>
                </Grid>
            </Paper>
        </div>
    );
};

export { MidiTrackPanel };
