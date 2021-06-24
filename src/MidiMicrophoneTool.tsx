//import { Midi, MidiJSON } from "@tonejs/midi";
import { useEffect, useRef, useState } from "react";
import "./MidiMicrophoneTool.css";
import MidiPlayer from "midi-player-js";
import Soundfont from "soundfont-player";

// const MidiPanel = () => {
//     return <div>Midi Panel</div>;
// };

// const AudioRecorder = () => {
//     return <div>Audio Recorder</div>;
// };

function MidiMicrophoneTool() {
    //const [midiArrayBuffer, setMidiArrayBuffer] = useState<ArrayBuffer | null>(null);
    //const [midiJSON, setMidiJSON] = useState<MidiJSON | null>(null);

    const [midiUri, setMidiUri] = useState<string | null>(null);
    const [soundFontLoaded, setSoundFontLoaded] = useState<boolean>(false);

    const fileReader = useRef<FileReader>(new FileReader());
    const ac = useRef<AudioContext>(new AudioContext());

    const player = useRef<MidiPlayer.Player>(new MidiPlayer.Player());
    const soundInstrument = useRef<Soundfont.Player | null>(null);

    const mediaStream = useRef<MediaStream | null>(null);
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const [hasMicrophoneAccess, setHasMicrophoneAccess] = useState<boolean>(false);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(false);

    const [audioSrc, setAudioSrc] = useState<string | null>(null);
    const chunks = useRef<Blob[]>([]);

    const audioRef = useRef<HTMLAudioElement>(null); //change legacy ref later

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
                        setIsRecording(true);
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
                        setIsRecording(false);
                    };
                    mediaRecorder.current = recorder;
                    setHasMicrophoneAccess(true);
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
            if (typeof result === "string") {
                setMidiUri(result);
                setAudioSrc(null); //reset the audio src
            }
        };
    }, []);

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

        fileReader.current.readAsDataURL(file);
    };

    const startRecording = () => {
        if (isRecording || mediaRecorder.current === null) return;
        mediaRecorder.current.start();
        console.log(mediaRecorder.current.state);
        player.current.play();
    };

    const stopRecording = () => {
        if (!isRecording || mediaRecorder.current === null) return;
        mediaRecorder.current.stop();
        console.log(mediaRecorder.current.state);
        player.current.stop();
    };

    const playPreview = () => {
        if (audioRef.current === null) return;
        if (player.current.isPlaying()) return;
        audioRef.current.play();
        audioRef.current.addEventListener("ended", stopPreview);
        player.current.play();
        setIsPreviewPlaying(true);
    };

    const pausePreview = () => {
        if (audioRef.current === null) return;
        if (!player.current.isPlaying()) return;
        audioRef.current.pause();
        player.current.pause();
        setIsPreviewPlaying(false);
    };

    const stopPreview = () => {
        if (audioRef.current === null) return;
        if (!player.current.isPlaying()) return;
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.removeEventListener("ended", stopPreview);
        player.current.stop();
        setIsPreviewPlaying(false);
    };

    const midiLoaded = midiUri !== null;
    const disablePreview = !midiLoaded || isRecording || audioSrc === null;

    return (
        <div className="App">
            <h1>{"MIDI & Microphone Rhythm Practice"}</h1>
            <input
                type="file"
                accept="audio/midi, audio/mid"
                onChange={(event) => readMidiUri(event)}
                disabled={!soundFontLoaded || isRecording || isPreviewPlaying}
            ></input>
            <br />
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
            <br />
            <br />
            <button onClick={() => playPreview()} disabled={disablePreview}>
                Play Preview
            </button>
            <button onClick={() => pausePreview()} disabled={disablePreview}>
                Pause Preview
            </button>
            <button onClick={() => stopPreview()} disabled={disablePreview}>
                Stop Preview
            </button>
            <br />
            <br />
            <div>
                {audioSrc && !isRecording ? (
                    <audio controls ref={audioRef}>
                        <source src={audioSrc as string} type="audio/ogg" />
                    </audio>
                ) : null}
            </div>
        </div>
    );
}

export default MidiMicrophoneTool;
