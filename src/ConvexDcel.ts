import DCEL from '../DCEL/dcel';
import ConvexFace from './classes/ConvexFace';
import ConvexHalfEdge from './classes/ConvexHalfEdge';
import ConvexVertex from './classes/ConvexVertex';
import { IConvexFace, IConvexHalfEdge, IConvexPoint } from './interfaces';
import { areCollinear, orientation } from './geometry/predicates';

export default class ConvexDcel extends DCEL {
    vertexes: Record<string, ConvexVertex> = {};
    faces: Record<string, ConvexFace> = {};
    halfEdges: Record<string, IConvexHalfEdge> = {};
    private outgoing = new Map<string, Set<IConvexHalfEdge>>();

    constructor(points: IConvexPoint[]) {
        super();
        if (points.length !== 4 || orientation(points[0], points[1], points[2], points[3]) === 0) {
            throw new RangeError('The initial tetrahedron must have four affinely independent points.');
        }
        for (let opposite = 0; opposite < 4; opposite++) {
            const face = points.filter((_, i) => i !== opposite);
            if (orientation(face[0], face[1], face[2], points[opposite]) > 0) [face[1], face[2]] = [face[2], face[1]];
            this.createTopology(face[0], face[1], face[2]);
        }
    }

    override createVertex(point: IConvexPoint): ConvexVertex {
        return new ConvexVertex(`${point.number}`, [point.x, point.y, point.z], null);
    }

    override getVertex(point: IConvexPoint): ConvexVertex {
        const id = `${point.number}`;
        if (!this.vertexes[id]) {
            this.vertexes[id] = this.createVertex(point);
            this.outgoing.set(id, new Set());
        }
        return this.vertexes[id];
    }

    override getHalfEdge(id: string, face: IConvexFace | null): IConvexHalfEdge {
        return this.halfEdges[id] ?? (this.halfEdges[id] = new ConvexHalfEdge(id, face));
    }

    override getHalfEdgeById(id: string): IConvexHalfEdge | null { return this.halfEdges[id] ?? null; }
    override getFaceById(id: string): IConvexFace { return this.faces[id]; }

    private createTopology(a: IConvexPoint, b: IConvexPoint, c: IConvexPoint): ConvexFace {
        if (areCollinear(a, b, c)) throw new Error('Cannot create a degenerate hull face.');
        const points = [a, b, c];
        const ids = points.map((point, i) => `${point.number}-${points[(i + 1) % 3].number}`);
        if (ids.some(id => this.halfEdges[id])) throw new Error('A directed hull edge already belongs to a face.');
        const face = new ConvexFace(a, b, c);
        const edges = ids.map(id => new ConvexHalfEdge(id, face));
        edges.forEach((edge, i) => {
            edge.origin = this.getVertex(points[i]);
            edge.next = edges[(i + 1) % 3];
            edge.prev = edges[(i + 2) % 3];
            const twin = this.halfEdges[`${points[(i + 1) % 3].number}-${points[i].number}`];
            if (twin) { edge.twin = twin; twin.twin = edge; }
            this.halfEdges[edge.id] = edge;
            this.outgoing.get(edge.origin.id)!.add(edge);
            edge.origin.incidentEdge = edge;
        });
        face.outerComponent = edges[0];
        this.faces[face.id] = face;
        return face;
    }

    public removeFaceById(id: string): void {
        const face = this.faces[id];
        if (!face) throw new Error(`Unknown hull face ${id}.`);
        const first = face.outerComponent;
        for (const edge of [first, first.next, first.prev]) {
            const outgoing = this.outgoing.get(edge.origin.id)!;
            outgoing.delete(edge);
            delete this.halfEdges[edge.id];
            edge.origin.incidentEdge = outgoing.values().next().value ?? null;
            if (!outgoing.size) {
                delete this.vertexes[edge.origin.id];
                this.outgoing.delete(edge.origin.id);
            }
        }
        delete this.faces[id];
    }

    public removeFacesByIds(ids: string[]): void { ids.forEach(id => this.removeFaceById(id)); }

    public addPointByBoundary(point: IConvexPoint, boundary: IConvexHalfEdge): ConvexFace {
        return this.createTopology(point, boundary.origin.toPoint(), boundary.next.origin.toPoint());
    }

    public addPoint(point: IConvexPoint, boundary: IConvexHalfEdge[]): void {
        boundary.forEach(edge => this.addPointByBoundary(point, edge));
    }

    public assertValid(): void {
        const faces = Object.values(this.faces), edges = Object.values(this.halfEdges), vertices = Object.values(this.vertexes);
        if (vertices.length - edges.length / 2 + faces.length !== 2 || edges.length !== 3 * faces.length) throw new Error('Invalid Euler characteristic.');
        for (const face of faces) {
            const edge = face.outerComponent;
            if (edge.next.next !== edge.prev || edge.prev.next !== edge) throw new Error('Invalid triangular face cycle.');
            if (areCollinear(edge.origin.toPoint(), edge.next.origin.toPoint(), edge.prev.origin.toPoint())) throw new Error('Degenerate hull face.');
            for (const item of [edge, edge.next, edge.prev]) {
                if (item.incidentFace !== face || this.halfEdges[item.id] !== item) throw new Error('Face-edge registration mismatch.');
            }
        }
        for (const edge of edges) {
            if (edge.next.prev !== edge || edge.prev.next !== edge || edge.twin?.twin !== edge) throw new Error('Broken half-edge links.');
            if (this.halfEdges[edge.twin.id] !== edge.twin || edge.twin.origin !== edge.next.origin) throw new Error('Invalid twin endpoint.');
            if (this.faces[edge.incidentFace.id] !== edge.incidentFace) throw new Error('Edge references a deleted face.');
            if (this.vertexes[edge.origin.id] !== edge.origin) throw new Error('Edge references a deleted vertex.');
        }
        for (const vertex of vertices) {
            if (!vertex.incidentEdge || this.halfEdges[vertex.incidentEdge.id] !== vertex.incidentEdge || vertex.incidentEdge.origin !== vertex) throw new Error('Invalid vertex incident edge.');
        }
    }
}
