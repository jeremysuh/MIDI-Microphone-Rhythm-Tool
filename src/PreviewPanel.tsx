// import { useRef, useState } from "react";

interface PreviewPanelProps {
    playPreview : Function,
    pausePreview : Function,
    stopPreview: Function, 
    disablePreview : boolean,
    audioSrc : any, 
    isRecording : boolean
    audioRef : React.Ref<HTMLAudioElement>

}

const PreviewPanel = ({playPreview, pausePreview, stopPreview, disablePreview, audioSrc, isRecording, audioRef}: PreviewPanelProps) => {
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
                    <audio controls ref={audioRef}>
                        <source src={audioSrc as string} type="audio/ogg" />
                    </audio>
                ) : null}
            </div>
        </div>
    );
};

export { PreviewPanel };
