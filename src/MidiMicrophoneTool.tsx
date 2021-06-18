import React from "react";
import { useState } from "react";
import "./MidiMicrophoneTool.css";
var MidiPlayer = require("midi-player-js");

const MidiPanel = () => {
    return <div>Midi Panel</div>;
};

const AudioRecorder = () => {
    return <div>Audio Recorder</div>;
};

function MidiMicrophoneTool() {
    const [activated, setActivated] = useState<boolean>(false);

    const onStart = () => {
        setActivated(true);
        console.log("start");
    };

    const onStop = () => {
        setActivated(false);
        console.log("stop");
    };

    return (
        <div className="App">
            <h1>{"MIDI & Microphone Rhythm Practice"}</h1>
            <MidiPanel />
            <AudioRecorder />
            <button onClick={() => onStart()}>Start</button>
            <button onClick={() => onStop()}>Stop</button>
        </div>
    );
}

export default MidiMicrophoneTool;
