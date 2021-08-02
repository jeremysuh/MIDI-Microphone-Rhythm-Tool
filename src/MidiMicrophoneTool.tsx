//import { Midi, MidiJSON } from "@tonejs/midi";
import { useEffect, useRef, useState } from "react";
import "./MidiMicrophoneTool.css";
import Soundfont from "soundfont-player";
import { Midi, MidiJSON } from "@tonejs/midi";
import { v4 as uuidv4 } from "uuid";
import * as MidiPlayerJS from "./midi-player-js/player";
import { useAnimationFrame } from "./CustomHooks";
import { WorkspacesList } from "./WorkspacesList";
import { WorkspaceDetails } from "./WorkspaceDetails";
import { PreviewPanel } from "./PreviewPanel";
import { MidiTrackPanel } from "./MidiTrackPanel";
import { Navbar } from "./Navbar";
import { AxiosError, AxiosResponse } from "axios";
const axios = require("axios").default;
require("dotenv").config();

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
    id: string;
    time: number[];
    text: string;
    workspaceId: string;
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
    const [isListening, setIsListening] = useState<boolean>(false);

    const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(false);

    const [audioSrc, setAudioSrc] = useState<string | null>(null);
    const chunks = useRef<Blob[]>([]);

    const audioRef = useRef<HTMLAudioElement>(null); //change legacy ref later

    const pointer = useRef<number>(0);

    const [currentWorkspace, setCurrentWorkspace] = useState<WorkSpace | null>(null);
    const [allWorkspaces, setAllWorkspaces] = useState<WorkSpace[]>([]);
    const [canCreateWorkspace, setCanCreateWorkspace] = useState<boolean>(false);

    const [fileName, setFileName] = useState<string | null>(null);

    const [displayName, setDisplayName] = useState<string>("");
    const [authenticated, setAuthenticated] = useState<boolean>(false);
    const [initialLoad, setInitialLoad] = useState<boolean>(false);

    const [midiInformation, setMidiInformation] = useState<MidiInformation>({
        totalLength: 0,
    });

    const [config, setConfig] = useState<Config>({
        startTime: 0,
        endTime: 0,
    });

    //User Auth
    useEffect(() => {
        const authenticate = async () => {
            const url =
                process.env.NODE_ENV === "production"
                    ? "https://midi-rhythm-tool-server.herokuapp.com/api/authenticate"
                    : "http://localhost:8080/api/authenticate";
            let config = {
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": true,
                },
                withCredentials: true,
            };
            await axios
                .get(url, config, { withCredentials: true })
                .then((response: AxiosResponse) => {
                    //logged in
                    const name = response.data;
                    console.log(name);
                    if (name) {
                        setAuthenticated(true);
                        setDisplayName(name);
                    }
                    setInitialLoad(true);
                })
                .catch((error: AxiosError) => {
                    //not logged in
                    setAuthenticated(false);
                    console.log(error.message);
                    setInitialLoad(true);
                });
        };
        authenticate();
    }, []);

    useEffect(() => {
        const retrieveUserWorkspaces = async () => {
            const url =
                process.env.NODE_ENV === "production"
                    ? "https://midi-rhythm-tool-server.herokuapp.com/api/userWorkspaces"
                    : "http://localhost:8080/api/userWorkspaces";
            if (authenticated)
                axios({
                    method: "get",
                    url: url,
                    withCredentials: true,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Credentials": true,
                    },
                })
                    .then((res: AxiosResponse) => {
                        const workspaces: any[] = res.data;
                        console.log(workspaces);
                        const newWorkspace = [];
                        for (const workspace of workspaces) {
                            const comments = workspace.comments.map((comment: any) => {
                                return {
                                    id: comment.id,
                                    time: comment.time,
                                    text: comment.text,
                                    workspaceId: comment.workspaceId,
                                };
                            });
                            newWorkspace.push({
                                id: workspace.id,
                                name: workspace.name,
                                midiMetaData: workspace.midiMetaData,
                                comments: comments,
                            });
                        }
                        setAllWorkspaces(workspaces);
                    })
                    .catch((e: AxiosError) => {
                        console.log(e.message);
                    });
        };

        if (authenticated) retrieveUserWorkspaces();
    }, [authenticated]);

    interface RecordingSession {
        time: number[];
    }
    const [recordingSessions, setRecordingSession] = useState<RecordingSession[]>([]);

    const [selectedCommentId, setSelectedCommentId] = useState<string>("");

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
            setSelectedCommentId(""); //reset; not sure if this is the right place
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
        setFileName(file.name);

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
            if (isRecording || isListening) {
                pointer.current += deltaTime / 1000;
                if (pointer.current > config.endTime) stopRecording(false);
            }
            //setCount(prevCount => (prevCount + deltaTime * 0.01) % 100)
        },
        [isRecording, config, isListening]
    );

    const startRecording = (listenModeOnly: boolean) => {
        //fix function args later
        if (isRecording || mediaRecorder.current === null) return;
        console.log(mediaRecorder.current.state);
        player.current.skipToSeconds(config.startTime).play();

        if (listenModeOnly) setIsListening(true);
        if (listenModeOnly === false) mediaRecorder.current.start();
    };

    const stopRecording = (listenModeOnly: boolean) => {
        if ((!isRecording && !isListening) || mediaRecorder.current === null) return;

        player.current.stop();
        pointer.current = config.startTime;

        if (listenModeOnly) setIsListening(false);

        if (listenModeOnly === false) {
            mediaRecorder.current.stop();

            const newRecordingSessions = recordingSessions.slice();
            if (newRecordingSessions.length > 0) newRecordingSessions.pop(); // adjust accordingly once multiple refs/audio at once is involved
            newRecordingSessions.push({ time: [config.startTime, Math.round(pointer.current * 10) / 10] }); //right now, only one session max
            setRecordingSession(newRecordingSessions);
        }
    };

    const playPreview = () => {
        if (audioRef.current === null) return;
        if (player.current.isPlaying()) return;
        if (recordingSessions.length === 0) return;
        audioRef.current.play();
        audioRef.current.addEventListener("ended", stopPreview);
        player.current.skipToSeconds(recordingSessions[0].time[0] + audioRef.current.currentTime).play(); //update when multiple sessions are added
        //player.current.skipToSeconds(config.startTime + audioRef.current.currentTime).play();
        setIsPreviewPlaying(true);
        console.log("play preview");
    };

    const pausePreview = () => {
        if (audioRef.current === null) return;
        if (!player.current.isPlaying()) return;
        audioRef.current.removeEventListener("ended", stopPreview);
        audioRef.current.pause();
        player.current.pause();
        setIsPreviewPlaying(false);
        console.log("pause preview");
    };

    const seekPreview = (time: number) => {
        if (audioRef.current === null) return;
        if (recordingSessions.length === 0) return;
        player.current.skipToSeconds(recordingSessions[0].time[0] + audioRef.current.currentTime).play(); //update when multiple sessions are added
        console.log("seek preview");
    };

    const stopPreview = () => {
        if (audioRef.current === null) return;
        if (!player.current.isPlaying()) return;
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        player.current.stop();
        setIsPreviewPlaying(false);
        audioRef.current.removeEventListener("ended", stopPreview);
        console.log("stopped preview");
    };

    const onCreateWorkspace = () => {
        if (midiJSON == null) {
            alert("Potentially invalid MIDI");
            return;
        }

        const uuid = uuidv4();
        const midiMetaData = {
            name: midiJSON.header.name,
            ppq: midiJSON.header.ppq,
            key: midiJSON.header.keySignatures[0] ? midiJSON.header.keySignatures[0].key : "N/A",
            scale: midiJSON.header.keySignatures[0] ? midiJSON.header.keySignatures[0].scale : "N/A",
            ticksCount: midiJSON.tracks[0].endOfTrackTicks ? midiJSON.tracks[0].endOfTrackTicks : 0,
            tracksCount: midiJSON.tracks.length,
            bpm: midiJSON.header.tempos[0] ? midiJSON.header.tempos[0].bpm : 0,
        };

        const newWorkspace: WorkSpace = {
            id: uuid,
            name: `${fileName} Workspace`,
            comments: [],
            midiMetaData: midiMetaData,
        };
        console.log(newWorkspace);
        setCurrentWorkspace(newWorkspace);
        setAllWorkspaces((workspace) => {
            const newVal = workspace.slice();
            newVal.push(newWorkspace);
            return newVal;
        });
        setCanCreateWorkspace(false);

        //save to backend
        const url =
            process.env.NODE_ENV === "production"
                ? "https://midi-rhythm-tool-server.herokuapp.com/api/workspace"
                : "http://localhost:8080/api/workspace";

        if (authenticated)
            axios({
                method: "post",
                url: url,
                withCredentials: true,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": true,
                },
                data: {
                    id: uuid, // This is the body part
                    name: `${fileName} Workspace`, // This is the body part
                    midiMetaData: midiMetaData,
                },
            });
    };

    const deleteWorkSpace = (id: string) => {
        const workspaceIndex = allWorkspaces.findIndex((workspace) => workspace.id === id);
        if (workspaceIndex === -1) return;

        let newWorkspaces = allWorkspaces.slice();
        newWorkspaces = newWorkspaces.filter((workspace) => workspace.id !== id);

        if (currentWorkspace && currentWorkspace.id === id) setCurrentWorkspace(null);
        setAllWorkspaces(newWorkspaces);

        const url =
            process.env.NODE_ENV === "production"
                ? "https://midi-rhythm-tool-server.herokuapp.com/api/workspace"
                : "http://localhost:8080/api/workspace";

        if (authenticated)
            axios({
                method: "delete",
                data: {
                    id: id,
                },
                url: url,
                withCredentials: true,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": true,
                },
            });
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

        const uuid = uuidv4();
        newWorkspaces[index].comments.push({
            id: uuid,
            time: time,
            text: comment,
            workspaceId: newWorkspaces[index].id,
        });
        setAllWorkspaces(newWorkspaces);

        //save to backend
        const url =
            process.env.NODE_ENV === "production"
                ? "https://midi-rhythm-tool-server.herokuapp.com/api/comment"
                : "http://localhost:8080/api/comment";

        if (authenticated)
            axios({
                method: "post",
                url: url,
                withCredentials: true,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": true,
                },
                data: {
                    id: uuid, // This is the body part
                    time: time,
                    text: comment,
                    workspaceId: workspaceId,
                },
            });
    };

    const selectComment = (id: string) => {
        setSelectedCommentId(id);
    };

    const deleteComment = (commentId: string, workspaceId: string) => {
        const workspaceIndex = allWorkspaces.findIndex((workspace) => workspace.id === workspaceId);
        if (workspaceIndex === -1) return;

        const newWorkspaces = allWorkspaces.slice();

        let newComments = newWorkspaces[workspaceIndex].comments.slice();
        newComments = newComments.filter((comment) => comment.id !== commentId);

        newWorkspaces[workspaceIndex].comments = newComments;

        setAllWorkspaces(newWorkspaces);

        const url =
            process.env.NODE_ENV === "production"
                ? "https://midi-rhythm-tool-server.herokuapp.com/api/comment"
                : "http://localhost:8080/api/comment";

        if (authenticated)
            axios({
                method: "delete",
                data: {
                    id: commentId,
                    workspaceId: workspaceId,
                },
                url: url,
                withCredentials: true,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": true,
                },
            });
    };

    const editComment = (commentId: string, workspaceId: string, newText: string) => {
        const workspaceIndex = allWorkspaces.findIndex((workspace) => workspace.id === workspaceId);
        if (workspaceIndex === -1) return;

        const newWorkspaces = allWorkspaces.slice();

        let newComments = newWorkspaces[workspaceIndex].comments.slice();

        const commentIndex = newComments.findIndex((comment) => comment.id === commentId);
        if (commentIndex === -1) return;

        newComments[commentIndex].text = newText;

        newWorkspaces[workspaceIndex].comments = newComments;

        setAllWorkspaces(newWorkspaces);

        const url =
            process.env.NODE_ENV === "production"
                ? "https://midi-rhythm-tool-server.herokuapp.com/api/comment"
                : "http://localhost:8080/api/comment";

        if (authenticated)
            axios({
                method: "patch",
                data: {
                    id: commentId,
                    workspaceId: workspaceId,
                    text: newText,
                },
                url: url,
                withCredentials: true,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": true,
                },
            });
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

    const selectedComment = currentWorkspace
        ? currentWorkspace.comments.find((comment) => comment.id === selectedCommentId)
        : null;

    return (
        <div>
            <Navbar displayName={displayName} authenticated={authenticated} initialLoad={initialLoad} />
            <div className="App">
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
                    pointer={pointer}
                    fileName={fileName}
                    midiJSON={midiJSON}
                    selectedComment={selectedComment}
                    isListening={isListening}
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
                            seekPreview={seekPreview}
                        />
                    );
                })}

                <WorkspaceDetails
                    currentWorkspace={currentWorkspace}
                    onCreateWorkspace={onCreateWorkspace}
                    canCreateWorkspace={canCreateWorkspace}
                    addCommentToWorkspace={addCommentToWorkspace}
                    selectComment={selectComment}
                    editComment={editComment}
                    deleteComment={deleteComment}
                    selectedComment={selectedComment}
                    config={config}
                />
                <WorkspacesList
                    changeWorkspaceTo={changeWorkspaceTo}
                    allWorkspaces={allWorkspaces}
                    loadedMidiMetaData={loadedMidiMetaData}
                    deleteWorkSpace={deleteWorkSpace}
                />
            </div>
        </div>
    );
}

export default MidiMicrophoneTool;
