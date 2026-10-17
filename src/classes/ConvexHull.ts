import ConvexDcel from '../ConvexDcel';
import { IConvexHalfEdge, IConvexPoint } from '../interfaces';
import { areCollinear, faceSide, orientation } from '../geometry/predicates';
import ConflictGraph from '../types/ConflictGraph';
import ConvexFace from './ConvexFace';

export interface HullOptions {
    random?: () => number;
    /** Expensive development checks after each insertion. */
    validate?: boolean;
}

/** Randomized incremental 3D hull. Lower-dimensional input is rejected explicitly. */
export class ConvexHull {
    private readonly convexDcel: ConvexDcel;
    private readonly conflictGraph: ConflictGraph = { points: new Map(), faces: new Map() };
    private readonly pointsById: Map<number, IConvexPoint>;
    private readonly originPoints: IConvexPoint[];

    constructor(input: readonly IConvexPoint[], options: HullOptions = {}) {
        const ids = new Set<number>();
        const coordinates = new Set<string>();
        const points: IConvexPoint[] = [];
        for (const point of input) {
            if (!Number.isSafeInteger(point.number) || ids.has(point.number)) {
                throw new TypeError('Point numbers must be unique safe integers.');
            }
            ids.add(point.number);
            if (![point.x, point.y, point.z].every(Number.isFinite)) {
                throw new TypeError('Point coordinates must be finite.');
            }
            // Keeps determinant products within the supported floating-point range.
            if ([point.x, point.y, point.z].some(v => Math.abs(v) > 1e75 || (v !== 0 && Math.abs(v) < 1e-75))) {
                throw new RangeError('Nonzero coordinates must have magnitude between 1e-75 and 1e75.');
            }
            const key = `${point.x},${point.y},${point.z}`;
            if (!coordinates.has(key)) {
                coordinates.add(key);
                points.push({ ...point });
            }
        }
        this.originPoints = points;
        this.pointsById = new Map(points.map(point => [point.number, point]));
        const [initial, remaining] = this.getInitialPoints(points);
        this.shuffle(remaining, options.random ?? Math.random);
        this.convexDcel = new ConvexDcel(initial);
        for (const face of Object.values(this.convexDcel.faces)) {
            for (const point of remaining) this.addConflict(face, point);
        }
        for (const point of remaining) {
            const visibleIds = new Set(this.conflictGraph.points.get(point.number));
            if (visibleIds.size) this.insert(point, visibleIds);
            this.removePointConflicts(point.number);
            if (options.validate) {
                this.convexDcel.assertValid();
                this.assertConflictGraph();
            }
        }
        if (options.validate) this.assertValid();
    }

    private getInitialPoints(points: IConvexPoint[]): [IConvexPoint[], IConvexPoint[]] {
        if (points.length < 4) throw new RangeError('A 3D hull needs at least four distinct points.');
        const first = points[0], second = points[1];
        const third = points.find(point => !areCollinear(first, second, point));
        if (!third) throw new RangeError('Cannot construct a 3D hull: the points are collinear.');
        const fourth = points.find(point => orientation(first, second, third, point) !== 0);
        if (!fourth) throw new RangeError('Cannot construct a 3D hull: the points are coplanar.');
        const initial = [first, second, third, fourth];
        const selected = new Set(initial.map(point => point.number));
        return [initial, points.filter(point => !selected.has(point.number))];
    }

    private shuffle(points: IConvexPoint[], random: () => number): void {
        for (let i = points.length - 1; i > 0; i--) {
            const value = random();
            if (!(value >= 0 && value < 1)) throw new RangeError('The random source must return values in [0, 1).');
            const j = Math.floor(value * (i + 1));
            [points[i], points[j]] = [points[j], points[i]];
        }
    }

    private insert(point: IConvexPoint, visibleIds: Set<string>): void {
        const horizon: IConvexHalfEdge[] = [];
        for (const id of visibleIds) {
            const face = this.convexDcel.faces[id];
            for (const edge of [face.outerComponent, face.outerComponent.next, face.outerComponent.prev]) {
                if (!visibleIds.has(edge.twin.incidentFace.id)) horizon.push(edge);
            }
        }
        // Validate and order the boundary before changing any topology.
        const byOrigin = new Map(horizon.map(edge => [edge.origin.id, edge]));
        if (horizon.length < 3 || byOrigin.size !== horizon.length) throw new Error('The visible region has an invalid horizon.');
        const ordered: IConvexHalfEdge[] = [];
        let edge = horizon[0];
        do {
            ordered.push(edge);
            byOrigin.delete(edge.origin.id);
            const destination = edge.next.origin.id;
            if (destination === ordered[0].origin.id) break;
            const next = byOrigin.get(destination);
            if (!next) throw new Error('The horizon is not a closed cycle.');
            edge = next;
        } while (ordered.length <= horizon.length);
        if (byOrigin.size) throw new Error('The visible region has multiple boundaries.');

        // Both adjacent OLD faces are needed by the conflict-graph lemma.
        const candidates = ordered.map(boundary => new Set([
            ...(this.conflictGraph.faces.get(boundary.incidentFace.id) ?? []),
            ...(this.conflictGraph.faces.get(boundary.twin.incidentFace.id) ?? [])
        ]));
        for (const id of visibleIds) this.removeFaceConflicts(id);
        this.convexDcel.removeFacesByIds([...visibleIds]);
        ordered.forEach((boundary, index) => {
            const face = this.convexDcel.addPointByBoundary(point, boundary);
            for (const id of candidates[index]) {
                if (id !== point.number) this.addConflict(face, this.pointsById.get(id)!);
            }
        });
    }

    private addConflict(face: ConvexFace, point: IConvexPoint): void {
        if (faceSide(face, point) <= 0) return;
        const faces = this.conflictGraph.points.get(point.number) ?? new Set<string>();
        const points = this.conflictGraph.faces.get(face.id) ?? new Set<number>();
        faces.add(face.id);
        points.add(point.number);
        this.conflictGraph.points.set(point.number, faces);
        this.conflictGraph.faces.set(face.id, points);
    }

    private removeFaceConflicts(id: string): void {
        for (const pointId of this.conflictGraph.faces.get(id) ?? []) {
            const faces = this.conflictGraph.points.get(pointId)!;
            faces.delete(id);
            if (!faces.size) this.conflictGraph.points.delete(pointId);
        }
        this.conflictGraph.faces.delete(id);
    }

    private removePointConflicts(id: number): void {
        for (const faceId of this.conflictGraph.points.get(id) ?? []) {
            const points = this.conflictGraph.faces.get(faceId)!;
            points.delete(id);
            if (!points.size) this.conflictGraph.faces.delete(faceId);
        }
        this.conflictGraph.points.delete(id);
    }

    private assertConflictGraph(): void {
        for (const [faceId, ids] of this.conflictGraph.faces) {
            if (!this.convexDcel.faces[faceId]) throw new Error('Conflict references a deleted face.');
            for (const id of ids) if (!this.conflictGraph.points.get(id)?.has(faceId)) throw new Error('Missing reverse conflict.');
        }
        for (const [id, faces] of this.conflictGraph.points) {
            for (const faceId of faces) if (!this.conflictGraph.faces.get(faceId)?.has(id)) throw new Error('Missing reverse conflict.');
        }
    }

    /** Checks topology, outward support planes, containment, and graph cleanup. */
    public assertValid(): void {
        this.convexDcel.assertValid();
        for (const face of Object.values(this.convexDcel.faces)) {
            for (const point of this.originPoints) {
                if (faceSide(face, point) > 0) throw new Error(`Point ${point.number} lies outside face ${face.id}.`);
            }
        }
        if (this.conflictGraph.faces.size || this.conflictGraph.points.size) throw new Error('Completed hull retains conflict records.');
    }

    public getFaces(): number[] {
        return Object.values(this.convexDcel.faces).flatMap(face => {
            const edge = face.outerComponent;
            return [...edge.origin.coordinates, ...edge.next.origin.coordinates, ...edge.prev.origin.coordinates];
        });
    }
}
