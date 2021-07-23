// import { useRef, useState } from "react";

interface WorkspaceDetailsProps {
    currentWorkspace: any | null;
}

const WorkspaceDetails = ({ currentWorkspace }: WorkspaceDetailsProps) => {
    return (
        <div>
            <div style={{ margin: "4px" }}>Current Workspace: {currentWorkspace ? currentWorkspace.name : "-"}</div>
            Current Workspace Panel:
            {currentWorkspace
                ? currentWorkspace.comments.map((comment: any) => {
                      return (
                          <div>
                              <div>Times:{comment.time[0] + " , " + comment.time[1]}</div>
                              <div>Text: {comment.text}</div>
                          </div>
                      );
                  })
                : null}
        </div>
    );
};

export { WorkspaceDetails };
