// import { useRef, useState } from "react";
import "rc-slider/assets/index.css";
import { Range } from "rc-slider";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";

import MicIcon from "@material-ui/icons/Mic";
import FiberManualRecordIcon from "@material-ui/icons/FiberManualRecord";
import StopIcon from "@material-ui/icons/Stop";
import Typography from "@material-ui/core/Typography";
import { useRef } from "react";
import { useAnimationFrame } from "./CustomHooks";

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
}: MidiTrackPanelProps) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const offset = useRef<number>(25);

    const canvasWidth = useRef<number>(800);
    const canvasHeight = useRef<number>(150);

    const trackWidth = useRef<number>(750);
    const trackHeight = useRef<number>(150);

    //const y = useRef<number>(0)

    useAnimationFrame(
        (delta: number) => {
            if (canvasRef.current === null) return;

            const ctx = canvasRef.current.getContext("2d");
            if (ctx === null || ctx === undefined) return;

            ctx.clearRect(0, 0, canvasWidth.current, canvasHeight.current);

            //ticker
            ctx.fillStyle = "orange";
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
        },
        [canvasRef, midiLoaded]
    );

    return (
        <div style={{ margin: "1em" }}>
            <Paper elevation={2} style={{ padding: "1em", minWidth: "60vw" }}>
                <Grid container justifyContent="space-between" spacing={1} alignItems="center" direction="column">
                    <input
                        type="file"
                        accept="audio/midi, audio/mid"
                        onChange={(event) => readMidiUri(event)}
                        disabled={!soundFontLoaded || isRecording || isPreviewPlaying}
                    ></input>
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
                        <Range
                            defaultValue={[0, 0]}
                            allowCross={false}
                            disabled={isRecording}
                            min={0}
                            max={midiInformation.totalLength}
                            value={[config.startTime, config.endTime]}
                            onChange={(value: number[]) => {
                                setConfig({
                                    startTime: value[0],
                                    endTime: value[1],
                                });
                            }}
                        />
                        <Typography variant="subtitle2">Start Time: {config.startTime}</Typography>
                        <Typography variant="subtitle2">End Time: {config.endTime}</Typography>
                    </div>
                    <br />
                    <IconButton onClick={() => allowMicrophoneAccess()} disabled={hasMicrophoneAccess}>
                        <MicIcon color={hasMicrophoneAccess ? "disabled" : "secondary"} />
                    </IconButton>
                    <br />
                    <br />
                    <Grid container justifyContent="center" spacing={1} alignItems="center" direction="row">
                        <Grid item key={0}>
                            <IconButton
                                onClick={() => startRecording()}
                                disabled={!midiLoaded || isRecording || !hasMicrophoneAccess}
                            >
                                <FiberManualRecordIcon />
                            </IconButton>
                        </Grid>
                        <Grid item key={1}>
                            <IconButton
                                onClick={() => stopRecording()}
                                disabled={!midiLoaded || !isRecording || !hasMicrophoneAccess}
                            >
                                <StopIcon />
                            </IconButton>
                        </Grid>
                    </Grid>
                </Grid>
            </Paper>
        </div>
    );
};

export { MidiTrackPanel };
