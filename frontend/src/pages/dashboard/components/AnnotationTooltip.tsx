import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AnnotationTooltipProps {
    msgContent: string;
    msgId: string;
    children: (props: {
        handleLinkInteraction: (link: string | null, isHover: boolean) => void;
        clickedLink: string | null;
        annotations: any[];
        currentIndex: number;
        tooltipRef: React.RefObject<HTMLDivElement>;
        setCurrentIndex: (index: number) => void;
    }) => ReactNode;
}

const AnnotationTooltip: React.FC<AnnotationTooltipProps> = ({ msgContent, children }) => {
    const [clickedLink, setClickedLink] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const tooltipRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

    // Handle outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
                setClickedLink(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Update clickedLink when currentIndex changes
    const updateClickedLinkFromIndex = (index: number) => {
        const annotation = annotations[index];
        if (annotation) {
            setClickedLink(annotation.reference);
        }
    };

    // Function to handle link interaction
    const handleLinkInteraction = (link: string | null, isHover: boolean) => {
        // Since we only care about clicks now, ignore hover events
        if (!isHover) {
            if (link === null) {
                setClickedLink(null);
            } else {
                const annotationIndex = annotations.findIndex(a => a.reference === link);
                if (annotationIndex !== -1) {
                    setCurrentIndex(annotationIndex);
                }
                setClickedLink(link === clickedLink ? null : link);
            }
        }
    };

    // Custom setCurrentIndex that also updates the clicked link
    const handleIndexChange = (newIndex: number) => {
        setCurrentIndex(newIndex);
        updateClickedLinkFromIndex(newIndex);
    };

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
            console.log('Parsed annotations:', parsed);
            return Array.isArray(parsed) ? parsed : [];
        } catch (err) {
            console.error('Annotation JSON parse error:', err);
            return [];
        }
    }, [msgContent]);

    return children({
        handleLinkInteraction,
        annotations,
        clickedLink,
        currentIndex,
        tooltipRef,
        setCurrentIndex: handleIndexChange
    });
};

export default AnnotationTooltip;
