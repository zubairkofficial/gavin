import {  ChevronLeft, ChevronRight } from "lucide-react";
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

        // Group citations by hostname
        const groupedCitations: { [hostname: string]: { c: any; hostname: string; fullPath: string; imgPath: string }[] } = {};
        citations.forEach((citation: any) => {
            let hostname = '';
            let fullPath = citation.reference || '';
            let imgPath = '';
            try {
                const cleanPath = fullPath.replace(/^<|>$/g, '').replace(/ target="_blank"$/, '');
                if (cleanPath.startsWith('http')) {
                    const url = new URL(cleanPath.trim());
                    hostname = url.hostname;
                    fullPath = url.href;
                    imgPath = url.protocol + hostname + '/favicon.ico';
                } else {
                    hostname = cleanPath.split('/')[2] || cleanPath;
                    fullPath = cleanPath;
                }
            } catch { hostname = fullPath; }
            if (!groupedCitations[hostname]) groupedCitations[hostname] = [];
            groupedCitations[hostname].push({ c: citation, hostname, fullPath, imgPath });
        });

        // Find the group and index for the currentCitationIndex
        let runningIndex = 0;
        let currentGroup: { c: any; hostname: string; fullPath: string; imgPath: string }[] | null = null;
        let currentGroupIndex = 0;
        for (const group of Object.values(groupedCitations)) {
            if (currentCitationIndex < runningIndex + group.length) {
                currentGroup = group;
                currentGroupIndex = currentCitationIndex - runningIndex;
                break;
            }
            runningIndex += group.length;
        }

        // Add at the top of the component
        const [openGroup, setOpenGroup] = React.useState<string | null>(null);
        const [locked, setLocked] = React.useState(false);
        const tooltipRef = React.useRef<HTMLDivElement>(null);

        // Close on outside click
        React.useEffect(() => {
            if (!locked) return;
            const handleClick = (e: MouseEvent) => {
                if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
                    setOpenGroup(null);
                    setLocked(false);
                }
            };
            document.addEventListener("mousedown", handleClick);
            return () => document.removeEventListener("mousedown", handleClick);
        }, [locked]);

        return (
            <div className="mt-2 mr-60 flex flex-row gap-2" ref={tooltipRef}>
                {Object.entries(groupedCitations).map(([hostname, group]) => {
                    const { c } = group[0];
                    const isTooltipOpen = openGroup === hostname;
                    const groupStartIndex = citations.findIndex((cit: any) => {
                        let h = '';
                        try {
                            const cleanPath = (cit.reference || '').replace(/^<|>$/g, '').replace(/ target="_blank"$/, '');
                            if (cleanPath.startsWith('http')) {
                                const url = new URL(cleanPath.trim());
                                h = url.hostname;
                            } else {
                                h = cleanPath.split('/')[2] || cleanPath;
                            }
                        } catch { h = cit.reference || ''; }
                        return h === hostname;
                    });
                    const groupCitations = group;
                    const groupCitationIndex = isTooltipOpen && currentGroup && currentGroup[0].hostname === hostname ? currentGroupIndex : 0;
                    const { fullPath, imgPath } = group[groupCitationIndex] || group[0];
                    return (
                        <div
                            key={hostname}
                            className="relative group border border-gray-400 rounded bg-black p-3 text-sm md:text-base w-fit h-7 flex justify-center items-center text-white px-3 py-2 mb-2 cursor-pointer transition-shadow hover:shadow-lg whitespace-nowrap"
                            onClick={e => {
                                e.stopPropagation();
                                if (openGroup === hostname && locked) {
                                    setOpenGroup(null);
                                    setLocked(false);
                                } else {
                                    setOpenGroup(hostname);
                                    setLocked(true);
                                }
                            }}
                        >


                            {c.code || c.title || c.citation || c.subject_area || c.fileName || "Reference"}
                            {isTooltipOpen && c.reference && (
                                <div className="absolute z-50 rounded-md -translate-x-1/2 bottom-full left-full ml-15 md:ml-40  mb-2 flex flex-col text-left justify-start min-w-[250px] md:min-w-[350px] max-w-xs bg-white text-gray-900 border border-gray-300 shadow-lg text-xs">
                                    {/* Arrow and navigation for only this group */}
                                    <div className="flex items-center rounded-t-md justify-between w-full bg-gray-100 p-2">
                                        <div>
                                            <button
                                                className="p-1 disabled:opacity-30"
                                                disabled={groupCitationIndex === 0}
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    setCurrentCitationIndex(groupStartIndex + Math.max(0, groupCitationIndex - 1));
                                                }}
                                            >
                                                <ChevronLeft className="cursor-pointer"/>
                                            </button>
                                            <button
                                                className="p-1 disabled:opacity-30"
                                                disabled={groupCitationIndex === groupCitations.length - 1}
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    setCurrentCitationIndex(groupStartIndex + Math.min(groupCitations.length - 1, groupCitationIndex + 1));
                                                }}
                                            >
                                                <ChevronRight className="cursor-pointer"/>
                                            </button>
                                        </div>
                                        <span className="font-semibold text-xs">
                                            {groupCitationIndex + 1} / {groupCitations.length}
                                        </span>
                                    </div>
                                    <div className="px-3 my-5">
                                        <div className="flex items-center mb-2 gap-2">
                                            <img src={imgPath} alt="icon" className="h-[22px] w-[22px] rounded-lg border-amber-200" />
                                            <div className="font-semibold">{hostname}</div>
                                        </div>
                                        <div className="break-all text-gray-700">
                                            <a
                                                href={fullPath}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block break-all whitespace-normal"
                                            >
                                                {fullPath}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    } catch (err) {
        console.error('Citation JSON parse error:', err, citationPart);
        return null;
    }
};

export default CitationTooltip;
