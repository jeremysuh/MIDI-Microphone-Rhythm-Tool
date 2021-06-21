//import { Midi, MidiJSON } from "@tonejs/midi";
import { useEffect, useRef, useState } from "react";
import "./MidiMicrophoneTool.css";

const MidiPanel = () => {
    return <div>Midi Panel</div>;
};

const AudioRecorder = () => {
    return <div>Audio Recorder</div>;
};

function MidiMicrophoneTool() {
    const [activated, setActivated] = useState<boolean>(false);
    const [midiUri, setMidiUri] = useState<string | null>("");
    //const [midiArrayBuffer, setMidiArrayBuffer] = useState<ArrayBuffer | null>(null);
    //const [midiJSON, setMidiJSON] = useState<MidiJSON | null>(null);
    const fileReader = useRef<FileReader>(new FileReader());

    useEffect(() => {
        if (midiUri === "") return;
        const setMidiObject = async () => {
            // await Midi.fromUrl(midiUri as string).then((json : MidiJSON) => setMidiJSON(json));
        };
        setMidiObject();
    }, [midiUri]);

    useEffect(() => {
        fileReader.current.onload = () => {
            const result: string | ArrayBuffer | null = fileReader.current.result;
            if (result === null) return;
            if (typeof result === "string") setMidiUri(result);
        };
    }, []);

    const onStart = () => {
        setActivated(true);
        console.log("start");
    };

    const onStop = () => {
        setActivated(false);
        console.log("stop");
    };

    const readMidiUri = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files === null) return;
        if (event.target.files.length !== 1) return;

        const file = event.target.files[0];
        if (file === undefined || file === null) return;

        const fileExtension = file.name.split('.').pop();
        if (fileExtension === undefined || 
            (fileExtension.toLowerCase() !== 'mid' && fileExtension.toLowerCase() !== 'midi')) { 
                console.log("file invalid")
                return;
            }

        fileReader.current.readAsDataURL(file); //triggers onload function
        //fileReader.current.readAsArrayBuffer(file);
        //fileReader.current.readAsText(file);
    };

    return (
        <div className="App">
            <h1>{"MIDI & Microphone Rhythm Practice"}</h1>
            <input type="file" accept="audio/midi, audio/mid" onChange={(event) => readMidiUri(event)}></input>
            <MidiPanel />
            <AudioRecorder />
            <div>{`Status: ${activated ? "Running" : "Stopped"}`}</div>
            <button onClick={() => onStart()}>Start</button>
            <button onClick={() => onStop()}>Stop</button>
            {/* <div style={{ textAlign: "center", borderStyle: "solid", margin: "1em", maxWidth: "85%" }}>
                {midiJSON === null ? "No MIDI file selected" : JSON.stringify(midiJSON)}
            </div> */}
        </div>
    );
}

export default MidiMicrophoneTool;
