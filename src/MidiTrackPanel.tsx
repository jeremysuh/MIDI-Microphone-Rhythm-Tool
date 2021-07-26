// import { useRef, useState } from "react";
import "rc-slider/assets/index.css";
import { Range } from "rc-slider";

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
        <div style={{margin: "1em"}}>
            <input
                type="file"
                accept="audio/midi, audio/mid"
                onChange={(event) => readMidiUri(event)}
                disabled={!soundFontLoaded || isRecording || isPreviewPlaying}
            ></input>
            <br />
            <div>{`MIDI Length (seconds): ${midiLoaded ? midiInformation.totalLength : `-`}`}</div>
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
                <div>Start Time: {config.startTime}</div>
                <div>End Time: {config.endTime}</div>
            </div>
            <br />
            <button onClick={() => allowMicrophoneAccess()} disabled={hasMicrophoneAccess}>
                Allow Microphone Access
            </button>
            <br />
            <br />
            <button onClick={() => startRecording()} disabled={!midiLoaded || isRecording}>
                Record Start
            </button>
            <button onClick={() => stopRecording()} disabled={!midiLoaded || !isRecording}>
                Record Stop
            </button>
        </div>
    );
};

export { MidiTrackPanel };
