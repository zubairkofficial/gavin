import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useEffect } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface CitationTooltipProps {
    msgId: string;
    msgContent: string;
    citationIndexes: { [msgId: string]: number };
    setCitationIndexes: React.Dispatch<React.SetStateAction<{ [msgId: string]: number }>>;
}

const CitationTooltip: React.FC<CitationTooltipProps> = ({ 
    msgId, 
    msgContent, 
    citationIndexes, 
    setCitationIndexes
}) => {
    // Track open state for each card

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

        // Close handler for clicking outside
        useEffect(() => {
            const handleClickOutside = (e: MouseEvent) => {
                const target = e.target as HTMLElement;
                if (!target.closest('.citation-card')) {
                    setCurrentCitationIndex(0); // Reset to first citation on outside click
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);

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

        return (
            <div className="mt-2   flex flex-row gap-2 cursor-pointer">
                {Object.entries(groupedCitations).map(([hostname, group]) => {
                    const { c } = group[0];
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
                    const groupCitationIndex = currentGroup && currentGroup[0].hostname === hostname ? currentGroupIndex : 0;
                    const { fullPath, imgPath } = group[groupCitationIndex] || group[0];

                    return (
                        <Popover 
                            key={hostname}
                          
                            
                        >
                            <PopoverTrigger asChild>
                                <div 
                                    className="citation-card cursor-pointer bg-white border-2 border-gray-200 hover:bg-black  px-2 mt-1 rounded-sm text-black hover:text-white transition-all duration-200 ease-in-out"
                                >
                                    {c.code || c.title || c.citation || c.subject_area || c.fileName || "Reference"}
                                </div>
                            </PopoverTrigger>
                            <PopoverContent 
                                className="citation-card  min-w-[250px] md:min-w-[350px] max-w-xs p-0 w-full ml-5 "
                                side="top"
                                align="center"
                            >
                                <div className="flex items-center rounded-t-md justify-between w-full bg-[#F9F9F9] p-2">
                                    <div>
                                        <button
                                            className="p-1 disabled:opacity-30 text-[#a7a4a4]"
                                            disabled={groupCitationIndex === 0}
                                            onClick={e => {
                                                e.stopPropagation();
                                                setCurrentCitationIndex(groupStartIndex + Math.max(0, groupCitationIndex - 1));
                                            }}
                                        >
                                            <ChevronLeft className="cursor-pointer"/>
                                        </button>
                                        <button
                                            className="p-1 disabled:opacity-30 text-[#a7a4a4]"
                                            disabled={groupCitationIndex === groupCitations.length - 1}
                                            onClick={e => {
                                                e.stopPropagation();
                                                setCurrentCitationIndex(groupStartIndex + Math.min(groupCitations.length - 1, groupCitationIndex + 1));
                                            }}
                                        >
                                            <ChevronRight className="cursor-pointer"/>
                                        </button>
                                    </div>
                                    <span className="font-semibold text-xs text-[#a7a4a4]">
                                        {groupCitationIndex + 1} / {groupCitations.length}
                                    </span>
                                </div>
                                <div className="px-3 my-5">
                                    <div className="flex items-center mb-2 gap-2">
                                        <img src={imgPath} alt="icon" className="h-[18px] w-[18px] rounded-lg border-amber-200 " />
                                        <div className="text-[#343434]  font-medium text-[12px]">{hostname}</div>
                                    </div>
                                    <div className="text-[#343434]  font-normal text-[12px] break-all">
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
                            </PopoverContent>
                        </Popover>
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
