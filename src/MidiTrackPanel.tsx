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
}: MidiTrackPanelProps) => {
    return (
        <div style={{ margin: "1em" }}>
            <Paper elevation={2} style={{ padding: "1em", minWidth: "50vw" }}>
                <Grid container justifyContent="space-between" spacing={1} alignItems="center" direction="column">
                    <input
                        type="file"
                        accept="audio/midi, audio/mid"
                        onChange={(event) => readMidiUri(event)}
                        disabled={!soundFontLoaded || isRecording || isPreviewPlaying}
                    ></input>
                    <br />
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            flexDirection: "column",
                            alignItems: "center",
                            minWidth: "50%",
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
