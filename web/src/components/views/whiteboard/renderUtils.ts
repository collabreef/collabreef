import { WhiteboardEdgeData } from '../../../types/view';

/**
 * Compute the SVG path `d` attribute for a whiteboard edge.
 */
export const computeEdgeSVGPath = (data: WhiteboardEdgeData): string => {
    const sx = data.startPoint.x;
    const sy = data.startPoint.y;
    const ex = data.endPoint.x;
    const ey = data.endPoint.y;

    if (data.curveType === 'bezier') {
        const midX = (sx + ex) / 2;
        const midY = (sy + ey) / 2;
        return `M ${sx} ${sy} Q ${midX} ${sy} ${midX} ${midY} Q ${midX} ${ey} ${ex} ${ey}`;
    }
    if (data.curveType === 'elbow') {
        const midX = (sx + ex) / 2;
        return `M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${ey} L ${ex} ${ey}`;
    }
    return `M ${sx} ${sy} L ${ex} ${ey}`;
};

/**
 * Compute start/end arrow angles for an edge (in radians).
 */
export const computeEdgeArrowAngles = (data: WhiteboardEdgeData): { startAngle: number; endAngle: number } => {
    const sx = data.startPoint.x;
    const sy = data.startPoint.y;
    const ex = data.endPoint.x;
    const ey = data.endPoint.y;

    if (data.curveType === 'bezier') {
        const midX = (sx + ex) / 2;
        const startAngle = Math.atan2(0, midX - sx) + Math.PI;
        const endAngle = Math.atan2(0, ex - midX);
        return { startAngle, endAngle };
    }
    if (data.curveType === 'elbow') {
        const midX = (sx + ex) / 2;
        const startAngle = sx < midX ? Math.PI : 0;
        const endAngle = ex > midX ? 0 : Math.PI;
        return { startAngle, endAngle };
    }
    const angle = Math.atan2(ey - sy, ex - sx);
    return { startAngle: angle + Math.PI, endAngle: angle };
};
