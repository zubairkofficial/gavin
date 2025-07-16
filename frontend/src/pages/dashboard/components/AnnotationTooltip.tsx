import React, { useState, useMemo, useEffect } from 'react';
import type { ReactNode, RefObject } from 'react';

interface Annotation {
    reference: string;
    title: string;
    type?: string;
    start_index?: string;
    end_index?: string;
}

interface AnnotationTooltipProps {
    msgContent: string;
    msgId: string;
    containerRef: RefObject<HTMLDivElement | null>;
    children: (props: {
        handleLinkInteraction: (link: string | null, isHover: boolean, event?: React.MouseEvent) => void;
        clickedLink: string | null;
        annotations: Annotation[];
        currentIndex: number;
        tooltipRef: RefObject<HTMLDivElement | null>;
        setCurrentIndex: (index: number) => void;
        tooltipPosition: { left: number; transform: string };
    }) => ReactNode;
}

const AnnotationTooltip: React.FC<AnnotationTooltipProps> = ({ msgContent, containerRef, children }) => {
    const [clickedLink, setClickedLink] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [tooltipPosition, setTooltipPosition] = useState({ left: 0, transform: 'none' });
    const tooltipRef = React.useRef<HTMLDivElement>(null);

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

    // Update tooltip position when link is clicked
    const updateTooltipPosition = (event: React.MouseEvent) => {
        if (!containerRef.current || !tooltipRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const clickX = event.clientX - containerRect.left;
        const tooltipWidth = tooltipRef.current.offsetWidth;
        const containerWidth = containerRect.width;

        let left = clickX;
        let transform = 'translateX(-50%)';

        // Adjust position if tooltip would overflow container
        if (clickX - tooltipWidth / 2 < 0) {
            left = tooltipWidth / 2;
            transform = 'translateX(-50%)';
        } else if (clickX + tooltipWidth / 2 > containerWidth) {
            left = containerWidth - tooltipWidth / 2;
            transform = 'translateX(-50%)';
        }

        setTooltipPosition({ left, transform });
    };

    // Function to handle link interaction
    const handleLinkInteraction = (link: string | null, isHover: boolean, event?: React.MouseEvent) => {
        if (!isHover && event) {
            if (link === null) {
                setClickedLink(null);
            } else {
                const annotationIndex = annotations.findIndex(a => a?.reference === link);
                if (annotationIndex !== -1) {
                    setCurrentIndex(annotationIndex);
                    updateTooltipPosition(event);
                }
                setClickedLink(link === clickedLink ? null : link);
            }
        }
    };

    // Custom setCurrentIndex that also updates the clicked link
    const handleIndexChange = (newIndex: number) => {
        setCurrentIndex(newIndex);
        const annotation = annotations[newIndex];
        if (annotation?.reference) {
            setClickedLink(annotation.reference);
        }
    };

    // Close tooltip when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
                setClickedLink(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return children({
        handleLinkInteraction,
        annotations,
        clickedLink,
        currentIndex,
        tooltipRef,
        setCurrentIndex: handleIndexChange,
        tooltipPosition
    });
};

export default AnnotationTooltip;
