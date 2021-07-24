// import { useRef, useState } from "react";

import "rc-slider/assets/index.css";
import { Range } from "rc-slider";
import { useEffect, useState } from "react";

interface PreviewPanelProps {
    playPreview: Function;
    pausePreview: Function;
    stopPreview: Function;
    disablePreview: boolean;
    audioSrc: any;
    isRecording: boolean;
    audioRef: React.Ref<HTMLAudioElement>;
    currentWorkspace: any;
    timeRange: number[];
    midiInformation: any;
    addCommentToWorkspace: Function;
}

const PreviewPanel = ({
    playPreview,
    pausePreview,
    stopPreview,
    disablePreview,
    audioSrc,
    isRecording,
    audioRef,
    currentWorkspace,
    timeRange,
    midiInformation,
    addCommentToWorkspace,
}: PreviewPanelProps) => {
    const [commentText, setCommentText] = useState<string>("");
    const [time, setTime] = useState<number[]>([timeRange[0], timeRange[1]]);

    useEffect(() => {
        setTime([timeRange[0], timeRange[1]]);
    }, [timeRange]);

    const onSubmitCommentClick = () => {
        if (currentWorkspace === false) return;
        addCommentToWorkspace(currentWorkspace.id, commentText, time);
        setCommentText("");
    };

    return (
        <div>
            <button onClick={() => playPreview()} disabled={disablePreview}>
                Play Preview
            </button>
            {/* {pause button currently ineffective when when pause & resuming; player starts back at config.startime instead} */}
            <button onClick={() => pausePreview()} disabled={disablePreview}>
                Pause Preview
            </button>
            <button onClick={() => stopPreview()} disabled={disablePreview}>
                Stop Preview
            </button>
            <br />
            <br />
            <div>
                {/* might have to change this approach as buffering issues are causing delay/problems in Chrome */}
                {/* or implement the player something like this */}
                {/* {https://letsbuildui.dev/articles/building-an-audio-player-with-react-hooks} */}
                {audioSrc && !isRecording ? (
                    <div>
                        <div>
                            <audio controls ref={audioRef}>
                                <source src={audioSrc as string} type="audio/ogg" />
                            </audio>
                        </div>
                        <label htmlFor="comment">Comment:</label>
                        <input
                            type="text"
                            id="comment"
                            name="comment"
                            required
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                        />
                        <Range
                            defaultValue={[0, 0]}
                            allowCross={false}
                            min={0}
                            max={midiInformation.totalLength}
                            value={[time[0], time[1]]}
                            onChange={(value: number[]) => {
                                setTime([value[0], value[1]]);
                            }}
                        />
                        <div>{"Time: " + time[0] + ", " + time[1]}</div>
                        <button
                            disabled={!currentWorkspace || commentText.length <= 0}
                            onClick={() => onSubmitCommentClick()}
                        >
                            Add Comment
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export { PreviewPanel };
