import { ChevronLast, ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";

interface CitationTooltipProps {
  msgId: string;
  msgContent: string;
  citationIndexes: { [msgId: string]: number };
  setCitationIndexes: React.Dispatch<React.SetStateAction<{ [msgId: string]: number }>>;
}

const CitationTooltip: React.FC<CitationTooltipProps> = ({ msgId, msgContent, citationIndexes, setCitationIndexes }) => {
  // Safely extract citation part
  let citationPart = "";
  const splitContent = msgContent.split('Citation00 :');
  if (splitContent.length > 1 && splitContent[1]) {
    citationPart = splitContent[1].trim();
  }
  if (!citationPart) return null;

  try {
    if (citationPart.startsWith('--')) {
      citationPart = citationPart.slice(2);
    }
    const citations = JSON.parse(citationPart);
    if (!Array.isArray(citations) || citations.length === 0) return null;

    // Use citationIndexes state to track current index per message
    const currentCitationIndex = citationIndexes[msgId] ?? 0;
    const setCurrentCitationIndex = (idx: number) => {
      setCitationIndexes(prev => ({ ...prev, [msgId]: idx }));
    };

    const c = citations[currentCitationIndex];
    let hostname = '';
    let fullPath = c.reference || '';
    let imgPath = '';

    try {
      const cleanPath = fullPath.replace(/^<|>$/g, '').replace(/ target="_blank"$/, '');
      if (cleanPath.startsWith('http')) {
        const url = new URL(cleanPath.trim());
        hostname = url.hostname;
        fullPath = url.href;
        imgPath = url.protocol + hostname + '/favicon.ico'; // Default image path, can be customized
      } else {
        hostname = cleanPath.split('/')[2] || cleanPath;
        fullPath = cleanPath;
      }
    } catch { /* ignore */ }

    return (
      <div className="mt-2 mr-60">
        <div className="relative group border border-gray-400 rounded bg-black p-3 w-fit h-7 flex justify-center items-center text-white px-3 py-2 mb-2 cursor-pointer transition-shadow hover:shadow-lg ">
          {/* Show only one field, e.g. code or title, but if hostname is different from previous, show full object */}
          {(() => {
            // Find previous citation's hostname if exists
            let prevHostname = null;
            if (currentCitationIndex > 0) {
              const prevCitation = citations[currentCitationIndex - 1];
              let prevFullPath = prevCitation.reference || '';
              try {
                const cleanPrevPath = prevFullPath.replace(/^<|>$/g, '').replace(/ target="_blank"$/, '');
                if (cleanPrevPath.startsWith('http')) {
                  const url = new URL(cleanPrevPath.trim());
                  prevHostname = url.hostname;
                } else {
                  prevHostname = cleanPrevPath.split('/')[2] || cleanPrevPath;
                }
              } catch { /* ignore */ }
            }
            if (!prevHostname || prevHostname === hostname) {
              // Same hostname or first citation: show as before
              return c.code || c.title || c.citation || c.subject_area || c.fileName || "Reference";
            } else {
              // Hostname changed: show the full object as JSON
              return (
                <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                  Host changed! {JSON.stringify(c)}
                </span>
              );
            }
          })()}
          {/* Tooltip on hover */}
          {c.reference && (
            <div className="absolute  z-50 rounded-md  -translate-x-1/2 bottom-full left-full ml-30 mb-2 hidden group-hover:flex flex-col text-left justify-start min-w-[350px] max-w-xs bg-white text-gray-900 border border-gray-300  shadow-lg text-xs">
              {/* Arrow and navigation */}
              <div className="flex items-center  rounded-t-md justify-between w-full  bg-gray-100 p-2">
                <div>
                  <button
                    className="p-1 disabled:opacity-30"
                    disabled={currentCitationIndex === 0}
                    onClick={e => {
                      e.stopPropagation();
                      setCurrentCitationIndex(Math.max(0, currentCitationIndex - 1));
                    }}
                  >
                    <ChevronLeft className="cursor-pointer"/>
                  </button>
                  <button
                    className="p-1 disabled:opacity-30"
                    disabled={currentCitationIndex === citations.length - 1}
                    onClick={e => {
                      e.stopPropagation();
                      setCurrentCitationIndex(Math.min(citations.length - 1, currentCitationIndex + 1));
                    }}
                  >
                    <ChevronRight className="cursor-pointer"/>
                  </button>
                </div>
                <span className="font-semibold text-xs">
                  {currentCitationIndex + 1} / {citations.length}
                </span>
              </div>
              <div className="px-3 my-5">
                <div className="flex items-center  mb-2 gap-2">
                  <img src={imgPath} alt="icon" className="h-[22px]  w-[22px] rounded-lg border-amber-200" />
                  <div className="font-semibold">{hostname}</div>
                </div>
                <div className="break-all text-gray-700"><a href={fullPath} target="_blank" rel="noopener noreferrer">
                  {fullPath}
                </a></div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } catch (err) {
    console.error('Citation JSON parse error:', err, citationPart);
    return null;
  }
};

export default CitationTooltip;
