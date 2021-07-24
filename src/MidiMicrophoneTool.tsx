//import { Midi, MidiJSON } from "@tonejs/midi";
import { useEffect, useRef, useState } from "react";
import "./MidiMicrophoneTool.css";
import Soundfont from "soundfont-player";
import { Midi, MidiJSON } from "@tonejs/midi";
import { v4 as uuidv4 } from "uuid";
import * as MidiPlayerJS from "./midi-player-js/player";
import { useAnimationFrame } from "./CustomHooks";
import { CreateWorkspaceButton, WorkspacesList } from "./WorkspacesList";
import { WorkspaceDetails } from "./WorkspaceDetails";
import { PreviewPanel } from "./PreviewPanel";
import { MidiTrackPanel } from "./MidiTrackPanel";

type MidiInformation = {
    totalLength: number;
};

type Config = {
    startTime: number;
    endTime: number;
};

type MidiMetaData = {
    name: string | null;
    key: string;
    scale: string;
    ppq: number;
    ticksCount: number;
    tracksCount: number;
    bpm: number;
};

type Comment = {
    time: number[];
    text: string;
};

type WorkSpace = {
    id: string;
    name: string;
    midiMetaData: MidiMetaData;
    comments: Comment[];
};

function MidiMicrophoneTool() {
    //const [midiArrayBuffer, setMidiArrayBuffer] = useState<ArrayBuffer | null>(null);
    const [midiJSON, setMidiJSON] = useState<MidiJSON | null>(null);

    const [midiUri, setMidiUri] = useState<string | null>(null);
    const [soundFontLoaded, setSoundFontLoaded] = useState<boolean>(false);

    const fileReader = useRef<FileReader>(new FileReader());
    const ac = useRef<AudioContext>(new AudioContext());

    const player = useRef<MidiPlayerJS.Player>(new MidiPlayerJS.Player()); // useRef<MidiPlayer.Player>(new MidiPlayer.Player());
    const soundInstrument = useRef<Soundfont.Player | null>(null);

    const mediaStream = useRef<MediaStream | null>(null);
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const [hasMicrophoneAccess, setHasMicrophoneAccess] = useState<boolean>(false);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(false);

    const [audioSrc, setAudioSrc] = useState<string | null>(null);
    const chunks = useRef<Blob[]>([]);

    const audioRef = useRef<HTMLAudioElement>(null); //change legacy ref later

    const pointer = useRef<number>(0);

    const [currentWorkspace, setCurrentWorkspace] = useState<WorkSpace | null>(null);
    const [allWorkspaces, setAllWorkspaces] = useState<WorkSpace[]>([]);
    const [canCreateWorkspace, setCanCreateWorkspace] = useState<boolean>(false);

    const [midiInformation, setMidiInformation] = useState<MidiInformation>({
        totalLength: 0,
    });

    const [config, setConfig] = useState<Config>({
        startTime: 0,
        endTime: 0,
    });

    interface RecordingSession {
        time: number[];
    }
    const [recordingSessions, setRecordingSession] = useState<RecordingSession[]>([]);

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
            player.current = new MidiPlayerJS.Player(function (event: any) {
                if (event.name === "Note on" && event.velocity > 0) {
                    instrument.play(event.noteName, ac.current.currentTime, { gain: event.velocity / 100 });
                }
            });
            player.current.on("fileLoaded", function () {
                setMidiInformation({ totalLength: player.current.getSongTime() });
                setConfig({
                    startTime: 0,
                    endTime: player.current.getSongTime(),
                });
            });
            player.current.on("endOfFile", function () {
                //identical to stopprecording function, handles when music is played until end, and not through user button click
                if (mediaRecorder.current === null) return;
                if (mediaRecorder.current.state === "inactive") return; //for preview listening, media recorder would be inactive,
                // so continuing on would result in a crash
                mediaRecorder.current.stop();
                player.current.stop(); //not sure if needed
                console.log("stopped");
            });
        });
    }, []);

    useEffect(() => {
        //console.log(midiJSON);
    }, [midiJSON]);

    useEffect(() => {
        if (midiUri === null) return;
        const setMidiObject = async () => {
            await Midi.fromUrl(midiUri as string).then((midi: Midi) => {
                console.log(midi.toJSON());
                setMidiJSON(midi.toJSON());
            });
        };
        player.current.loadDataUri(midiUri);
        setMidiObject();
        setCurrentWorkspace(null);
        setCanCreateWorkspace(true); //enable create workspace creation
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

    useEffect(() => {
        if (player.current) {
            player.current.skipToSeconds(config.startTime); //note i edited the index.d.ts file; not sure if this will cause error
        }
        pointer.current = config.startTime;
    }, [config]);

    useEffect(() => {}, [midiInformation]);

    const readMidiUri = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files === null) return;
        if (event.target.files.length !== 1) return;

        const file = event.target.files[0];
        if (file === undefined || file === null) return;

        const fileExtension = file.name.split(".").pop();
        if (
            fileExtension === undefined ||
            (fileExtension.toLowerCase() !== "mid" && fileExtension.toLowerCase() !== "midi")
        ) {
            console.log("file invalid");
            return;
        }

        fileReader.current.readAsDataURL(file);
    };

    useAnimationFrame(
        (deltaTime: number) => {
            // Pass on a function to the setter of the state
            // to make sure we always have the latest state
            if (isRecording) {
                pointer.current += deltaTime / 1000;
                if (pointer.current > config.endTime) stopRecording();
            }
            //setCount(prevCount => (prevCount + deltaTime * 0.01) % 100)
        },
        [isRecording, config]
    );

    const startRecording = () => {
        if (isRecording || mediaRecorder.current === null) return;
        mediaRecorder.current.start();
        console.log(mediaRecorder.current.state);
        player.current.skipToSeconds(config.startTime).play();
    };

    const stopRecording = () => {
        if (!isRecording || mediaRecorder.current === null) return;
        mediaRecorder.current.stop();

        const newRecordingSessions = recordingSessions.slice();
        if (newRecordingSessions.length > 0) newRecordingSessions.pop(); // adjust accordingly once multiple refs/audio at once is involved
        newRecordingSessions.push({ time: [config.startTime, config.endTime] }); //right now, only one session max
        setRecordingSession(newRecordingSessions);

        console.log(mediaRecorder.current.state);
        player.current.stop();
    };

    const playPreview = () => {
        if (audioRef.current === null) return;
        if (player.current.isPlaying()) return;
        audioRef.current.play();
        audioRef.current.addEventListener("ended", stopPreview);
        player.current.skipToSeconds(config.startTime + audioRef.current.currentTime).play();
        setIsPreviewPlaying(true);
    };

    const pausePreview = () => {
        if (audioRef.current === null) return;
        if (!player.current.isPlaying()) return;
        audioRef.current.removeEventListener("ended", stopPreview);
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

    const onCreateWorkspace = () => {
        if (midiJSON == null) {
            alert("Potentially invalid MIDI");
            return;
        }

        const uuid = uuidv4();

        const newWorkspace: WorkSpace = {
            id: uuid,
            name: `Workspace: ${uuid}`,
            comments: [
                {
                    time: [Math.round(10 * Math.random()), Math.round(10 * Math.random()) + 30],
                    text: "sample",
                },
                {
                    time: [Math.round(10 * Math.random()), Math.round(10 * Math.random()) + 30],
                    text: "sample2",
                },
            ],
            midiMetaData: {
                name: midiJSON.header.name,
                ppq: midiJSON.header.ppq,
                key: midiJSON.header.keySignatures[0] ? midiJSON.header.keySignatures[0].key : "N/A",
                scale: midiJSON.header.keySignatures[0] ? midiJSON.header.keySignatures[0].scale : "N/A",
                ticksCount: midiJSON.tracks[0].endOfTrackTicks ? midiJSON.tracks[0].endOfTrackTicks : 0,
                tracksCount: midiJSON.tracks.length,
                bpm: midiJSON.header.tempos[0] ? midiJSON.header.tempos[0].bpm : 0,
            },
        };
        console.log(newWorkspace);
        setCurrentWorkspace(newWorkspace);
        setAllWorkspaces((workspace) => {
            const newVal = workspace.slice();
            newVal.push(newWorkspace);
            return newVal;
        });
        setCanCreateWorkspace(false);
    };

    const changeWorkspaceTo = (id: string) => {
        if (currentWorkspace && currentWorkspace.id === id) return;
        const workspaceIndex = allWorkspaces.findIndex((workspace) => workspace.id === id);
        if (workspaceIndex === -1) return;
        setCurrentWorkspace(allWorkspaces[workspaceIndex]);
    };

    const addCommentToWorkspace = (workspaceId: string, comment: string, time: number[]) => {
        const newWorkspaces = allWorkspaces.slice();
        const index = newWorkspaces.findIndex((workspace) => workspaceId === workspace.id);
        newWorkspaces[index].comments.push({
            time: time,
            text: comment,
        });
        setAllWorkspaces(newWorkspaces);
    };

    const midiLoaded = midiUri !== null;
    const disablePreview = !midiLoaded || isRecording || audioSrc === null;

    const loadedMidiMetaData: MidiMetaData | null = midiJSON
        ? {
              name: midiJSON.header.name,
              ppq: midiJSON.header.ppq,
              key: midiJSON.header.keySignatures[0] ? midiJSON.header.keySignatures[0].key : "N/A",
              scale: midiJSON.header.keySignatures[0] ? midiJSON.header.keySignatures[0].scale : "N/A",
              ticksCount: midiJSON.tracks[0].endOfTrackTicks ? midiJSON.tracks[0].endOfTrackTicks : 0,
              tracksCount: midiJSON.tracks.length,
              bpm: midiJSON.header.tempos[0] ? midiJSON.header.tempos[0].bpm : 0,
          }
        : null;

    return (
        <div className="App">
            <h1>{"MIDI & Microphone Rhythm Practice"}</h1>
            <MidiTrackPanel
                soundFontLoaded={soundFontLoaded}
                isRecording={isRecording}
                isPreviewPlaying={isPreviewPlaying}
                midiLoaded={midiLoaded}
                midiInformation={midiInformation}
                readMidiUri={readMidiUri}
                config={config}
                setConfig={setConfig}
                allowMicrophoneAccess={allowMicrophoneAccess}
                hasMicrophoneAccess={hasMicrophoneAccess}
                startRecording={startRecording}
                stopRecording={stopRecording}
            />
            <br />
            {recordingSessions.map((session, index) => {
                //adjust when multiple sessions involved (including audio refs)
                return (
                    <PreviewPanel
                        key={index}
                        playPreview={playPreview}
                        pausePreview={pausePreview}
                        stopPreview={stopPreview}
                        disablePreview={disablePreview}
                        audioSrc={audioSrc}
                        isRecording={isRecording}
                        audioRef={audioRef}
                        currentWorkspace={currentWorkspace}
                        timeRange={session.time}
                        midiInformation={midiInformation}
                        addCommentToWorkspace={addCommentToWorkspace}
                    />
                );
            })}

            <CreateWorkspaceButton canCreateWorkspace={canCreateWorkspace} onCreateWorkspace={onCreateWorkspace} />
            <WorkspaceDetails currentWorkspace={currentWorkspace} />
            <WorkspacesList
                changeWorkspaceTo={changeWorkspaceTo}
                allWorkspaces={allWorkspaces}
                loadedMidiMetaData={loadedMidiMetaData}
            />
        </div>
    );
}

export default MidiMicrophoneTool;
