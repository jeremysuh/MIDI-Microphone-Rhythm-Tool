//import { Midi, MidiJSON } from "@tonejs/midi";
import { useEffect, useRef, useState } from "react";
import "./MidiMicrophoneTool.css";
import MidiPlayer from "midi-player-js";
import Soundfont from "soundfont-player";

const MidiPanel = () => {
    return <div>Midi Panel</div>;
};

const AudioRecorder = () => {
    return <div>Audio Recorder</div>;
};

function MidiMicrophoneTool() {
    const [activated, setActivated] = useState<boolean>(false);
    const [midiUri, setMidiUri] = useState<string | null>(null);
    const [soundFontLoaded, setSoundFontLoaded] = useState<boolean>(false);
    //const [midiArrayBuffer, setMidiArrayBuffer] = useState<ArrayBuffer | null>(null);
    //const [midiJSON, setMidiJSON] = useState<MidiJSON | null>(null);
    const fileReader = useRef<FileReader>(new FileReader());
    const ac = useRef<AudioContext>(new AudioContext());

    const player = useRef<MidiPlayer.Player>(new MidiPlayer.Player());
    const soundInstrument = useRef<Soundfont.Player | null>(null);

    const mediaStream = useRef<MediaStream | null>(null);
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const [microphoneAccess, setMicrophoneAccess] = useState<boolean>(false);
    const [recording, setRecording] = useState<boolean>(false);

    const [audioSrc, setAudioSrc] = useState<string | null>(null);
    const chunks = useRef<Blob[]>([]);

    const allowMicrophoneAccess = () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            console.log("getUserMedia supported.");
            navigator.mediaDevices
                .getUserMedia(
                    // constraints - only audio needed for this app
                    {
                        audio: true,
                    }
                )
                // Success callback
                .then(function (stream: MediaStream) {
                    mediaStream.current = stream;
                    const recorder = new MediaRecorder(stream);
                    recorder.onstart = function (e) {
                        setRecording(true);
                    };
                    recorder.ondataavailable = function (e: BlobEvent) {
                        //chunks.push(e.data);
                        console.log("on data available");
                        console.log(e.data);
                        chunks.current.push(e.data);
                    };
                    recorder.onstop = function (e) {
                        const blob = new Blob(chunks.current, { type: "audio/ogg; codecs=opus" });
                        chunks.current = [];
                        const audioURL = window.URL.createObjectURL(blob);
                        setAudioSrc(audioURL);
                        setRecording(false); //<-not on startrecord function; file delay
                    };
                    mediaRecorder.current = recorder;

                    setMicrophoneAccess(true);
                })

                // Error callback
                .catch(function (err) {
                    console.log("The following getUserMedia error occurred: " + err);
                });
        } else {
            console.log("getUserMedia not supported on your browser!");
        }
    };

    useEffect(() => {
        Soundfont.instrument(ac.current, "acoustic_guitar_nylon").then(function (instrument: Soundfont.Player) {
            soundInstrument.current = instrument;
            setSoundFontLoaded(true);
            player.current = new MidiPlayer.Player(function (event: any) {
                if (event.name === "Note on" && event.velocity > 0) {
                    instrument.play(event.noteName, ac.current.currentTime, { gain: event.velocity / 100 });
                }
            });
        });
    }, []);

    useEffect(() => {
        if (midiUri === null) return;
        const setMidiObject = async () => {
            // await Midi.fromUrl(midiUri as string).then((json : MidiJSON) => setMidiJSON(json));
        };
        player.current.loadDataUri(midiUri);
        setMidiObject();
    }, [midiUri]);

    useEffect(() => {
        fileReader.current.onload = () => {
            const result: string | ArrayBuffer | null = fileReader.current.result;
            if (result === null) return;
            if (typeof result === "string") setMidiUri(result);
        };
    }, []);

    const recordStart = () => {
        if (recording || mediaRecorder.current === null) return;
        mediaRecorder.current.start();
        console.log(mediaRecorder.current.state);
        console.log("recorder started");
    };

    const recordStop = () => {
        if (!recording || mediaRecorder.current === null) return;
        mediaRecorder.current.stop();
        console.log(mediaRecorder.current.state);
        console.log("recorder stopped");
    };

    const onStart = () => {
        if (player.current.isPlaying()) return;
        setActivated(true);
        player.current.play();
        console.log("start");
    };

    const onPause = () => {
        if (player.current.isPlaying() === false) return;
        setActivated(false);
        player.current.pause();
        console.log("pause");
    };

    const onStop = () => {
        if (player.current.isPlaying() === false) return;
        setActivated(false);
        player.current.stop();
        console.log("stop");
    };

    const readMidiUri = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files === null) return;
        if (event.target.files.length !== 1) return;

        const file = event.target.files[0];
        if (file === undefined || file === null) return;

        const fileExtension = file.name.split(".").pop();
        if (fileExtension === undefined || (fileExtension.toLowerCase() !== "mid" && fileExtension.toLowerCase() !== "midi")) {
            console.log("file invalid");
            return;
        }

        fileReader.current.readAsDataURL(file); //triggers onload function
        //fileReader.current.readAsArrayBuffer(file);
        //fileReader.current.readAsText(file);
    };

    return (
        <div className="App">
            <h1>{"MIDI & Microphone Rhythm Practice"}</h1>
            <input type="file" accept="audio/midi, audio/mid" onChange={(event) => readMidiUri(event)} disabled={!soundFontLoaded}></input>
            <MidiPanel />
            <AudioRecorder />
            <div>{`Status: ${activated ? "Running" : "Stopped"}`}</div>
            <button onClick={() => onStart()} disabled={midiUri === null}>
                Start
            </button>
            <button onClick={() => onPause()} disabled={midiUri === null}>
                Pause
            </button>
            <button onClick={() => onStop()} disabled={midiUri === null}>
                Stop
            </button>
            <div>
                <button onClick={() => allowMicrophoneAccess()} disabled={microphoneAccess}>
                    Allow Microphone Access
                </button>
                <button disabled={!microphoneAccess} onClick={() => recordStart()}>
                    Record
                </button>
                <button disabled={!microphoneAccess} onClick={() => recordStop()}>
                    Stop
                </button>
            </div>
            <div>
                {audioSrc && !recording ? (
                    <audio controls>
                        <source src={audioSrc as string} type="audio/ogg" />
                    </audio>
                ) : null}
            </div>
            {/* <div style={{ textAlign: "center", borderStyle: "solid", margin: "1em", maxWidth: "85%" }}>
                {midiJSON === null ? "No MIDI file selected" : JSON.stringify(midiJSON)}
            </div> */}
        </div>
    );
}

export default MidiMicrophoneTool;
