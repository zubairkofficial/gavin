import React, { useState, useMemo } from 'react';
import type { ReactNode, RefObject } from 'react';

interface AnnotationTooltipProps {
    msgContent: string;
    msgId: string;
    containerRef: RefObject<HTMLDivElement | null>;
    children: (props: {
        handleLinkInteraction: (link: string | null) => void;
        clickedLink: string | null;
        annotations: any[];
        currentIndex: number;
        tooltipRef: RefObject<HTMLDivElement | null>;
        setCurrentIndex: (index: number) => void;
        tooltipPosition: { left: number; transform: string };
    }) => ReactNode;
}

const AnnotationTooltip: React.FC<AnnotationTooltipProps> = ({ msgContent, children }) => {
    const [clickedLink, setClickedLink] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);


    // Parse annotations from message content
    const annotations = useMemo(() => {
        try {
            const splitContent = msgContent.split('annotations :');
            if (splitContent.length <= 1) return [];
            
            let annotationsPart = splitContent[1].trim();
            if (annotationsPart.startsWith('--')) {
                annotationsPart = annotationsPart.slice(2);
            }
            
            const parsed = JSON.parse(annotationsPart);
            return Array.isArray(parsed) ? parsed : [];
        } catch (err) {
            console.error('Annotation JSON parse error:', err);
            return [];
        }
    }, [msgContent]);

    // Function to handle link interaction
    const handleLinkInteraction = (link: string | null, ) => {
        
                const annotationIndex = annotations.findIndex(a => a.reference === link);
                if (annotationIndex !== -1) {
                    setCurrentIndex(annotationIndex);
                }
                setClickedLink(link === clickedLink ? null : link);
        
    };

    // Custom setCurrentIndex that also updates the clicked link
    const handleIndexChange = (newIndex: number) => {
        setCurrentIndex(newIndex);
        const annotation = annotations[newIndex];
        if (annotation) {
            setClickedLink(annotation.reference);
        }
    };

    const renderAnnotationContent = (annotation: any) => {
        if (!annotation) return null;

        return (
            <div className="px-3 my-5">
                <div className="flex items-center mb-2 gap-2">
                    {annotation.reference && (
                        <img
                            src={`${new URL(annotation.reference).protocol}//${new URL(annotation.reference).hostname}/favicon.ico`}
                            alt="icon"
                            className="h-[22px] w-[22px] rounded-lg border-amber-200"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none'
                            }}
                        />
                    )}
                    <div className="font-semibold text-gray-600">
                        {annotation.reference ? new URL(annotation.reference).hostname : 'Reference'}
                    </div>
                </div>
                <h4 className="font-semibold mb-2 text-sm text-gray-700">{annotation.title}</h4>
                <div className="break-all text-gray-600">
                    <a
                        href={annotation.reference}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block break-all whitespace-normal"
                    >
                        {annotation.reference}
                    </a>
                </div>
            </div>
        );
    };

    return children({
        handleLinkInteraction,
        annotations,
        clickedLink,
        currentIndex,
        tooltipRef: { current: null },
        setCurrentIndex: handleIndexChange,
        tooltipPosition: { left: 0, transform: 'none' }
    });
};

export default AnnotationTooltip;
