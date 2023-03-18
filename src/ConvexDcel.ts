// Doubly connected edge list
import ConvexFace from "./classes/ConvexFace";
import Vertex from "./classes/ConvexVertex";
import { IConvexFace, IConvexHalfEdge, IConvexPoint } from "./interfaces";
import DCEL from '../../DCEL/dcel';
import ConvexHalfEdge from "./classes/ConvexHalfEdge";
import ConvexVertex from "./classes/ConvexVertex";

export default class ConvexDcel extends DCEL {

    vertexes: { [id: string]: ConvexVertex } = {};

    faces: { [id: string]: ConvexFace } = {};

    halfEdges: { [id: string]: IConvexHalfEdge } = {};

    // initialize from tetrahedron
    // The array of points must consist of four initial points
    constructor(points: IConvexPoint[]) {
        super();
        const p1 = points[0];
        const p2 = points[1];
        const p3 = points[2];
        const p4 = points[3];

        this.createTopology(p1, p2, p4);
        this.createTopology(p3, p1, p4);
        this.createTopology(p2, p3, p4);
        this.createTopology(p3, p2, p1);
    }

    override getVertex(point: IConvexPoint) {
        const vertex = this.vertexes[`${point.number}`];
        if (vertex) {
            return vertex;
        } else {
            const newVertex = this.createVertex(point);
            this.vertexes[newVertex.id] = newVertex;
            return newVertex;
        }
    }

    private createTopology(point1: IConvexPoint, point2: IConvexPoint, point3: IConvexPoint) {
        // 1. Create vertexes
        this.getVertex(point1);
        this.getVertex(point2);
        this.getVertex(point3);

        // 2. Create faces
        const face = this.createConvexFace(point1, point2, point3);
        this.faces[face.id] = face;

        // 3. Create Half edges
        this.createHalfEdges(point1, point2, point3)
    }

    private createConvexFace(point1: IConvexPoint, point2: IConvexPoint, point3: IConvexPoint) {
        return new ConvexFace(point1, point2, point3);
    }

    override getHalfEdge(halfEdgeId: string, face: IConvexFace | null): IConvexHalfEdge {
        // const halfEdgeId = `${edgePoints.firstEdgePoint.number}-${edgePoints.secondEdgePoint.number}`;
        const halfEdge = this.halfEdges[halfEdgeId];
        if (halfEdge) {
            if (face && !halfEdge.incidentFace) halfEdge.incidentFace = face;
            return halfEdge;
        } else {
            const newHalfEdge = new ConvexHalfEdge(halfEdgeId, face);
            this.halfEdges[newHalfEdge.id] = newHalfEdge;
            return newHalfEdge;
        }
    }

    override getHalfEdgeById(halfEdgeId: string): IConvexHalfEdge | null {
        return this.halfEdges[halfEdgeId] || null;
    }

    override getFaceById(faceId: string): IConvexFace {
        return this.faces[faceId];
    }

    private createHalfEdges(facePoint1: IConvexPoint, facePoint2: IConvexPoint, facePoint3: IConvexPoint) {
        const faceId = `${facePoint1.number}-${facePoint2.number}-${facePoint3.number}`;
        const face = this.getFaceById(faceId);
        
        const currentHalfEdgeId = `${facePoint1.number}-${facePoint2.number}`;
        const currentHalfEdge = this.getHalfEdge(currentHalfEdgeId, face);
        currentHalfEdge.origin = this.getVertex(facePoint1);
        face.outerComponent = currentHalfEdge;

        const previousHalfEdgeId = `${facePoint3.number}-${facePoint1.number}`;
        const previousHalfEdge = this.getHalfEdge(previousHalfEdgeId, face);
        previousHalfEdge.origin = this.getVertex(facePoint3);

        const nextHalfEdgeId = `${facePoint2.number}-${facePoint3.number}`;
        const nextHalfEdge = this.getHalfEdge(nextHalfEdgeId, face);
        nextHalfEdge.origin = this.getVertex(facePoint2);

        const currentTwinHalfEdge = this.getHalfEdgeById(`${facePoint2.number}-${facePoint1.number}`);
        if (currentTwinHalfEdge) {
            currentTwinHalfEdge.origin = this.getVertex(facePoint2);
        }

        const previousTwinHalfEdge = this.getHalfEdgeById(`${facePoint1.number}-${facePoint3.number}`);
        if (previousTwinHalfEdge) {
            previousTwinHalfEdge.origin = this.getVertex(facePoint1);
        }

        const nextTwinHalfEdge = this.getHalfEdgeById(`${facePoint3.number}-${facePoint2.number}`);
        if (nextTwinHalfEdge) {
            nextTwinHalfEdge.origin = this.getVertex(facePoint3);
        }

        currentHalfEdge.next = nextHalfEdge;
        currentHalfEdge.prev = previousHalfEdge;

        previousHalfEdge.next = currentHalfEdge;
        previousHalfEdge.prev = nextHalfEdge;

        nextHalfEdge.next = previousHalfEdge;
        nextHalfEdge.prev = currentHalfEdge;

        if (currentTwinHalfEdge) {
            currentHalfEdge.twin = currentTwinHalfEdge;
            currentTwinHalfEdge.twin = currentHalfEdge;
            this.halfEdges[currentTwinHalfEdge.id] = currentTwinHalfEdge;
        }

        if (previousTwinHalfEdge) {
            previousTwinHalfEdge.twin = previousHalfEdge;
            previousHalfEdge.twin = previousTwinHalfEdge;
            this.halfEdges[previousTwinHalfEdge.id] = previousTwinHalfEdge;
        }
        
        if (nextTwinHalfEdge) {
            nextTwinHalfEdge.twin = nextHalfEdge;
            nextHalfEdge.twin = nextTwinHalfEdge;
            this.halfEdges[nextTwinHalfEdge.id] = nextTwinHalfEdge;
        }

        this.halfEdges[currentHalfEdge.id] = currentHalfEdge;
        this.halfEdges[previousHalfEdge.id] = previousHalfEdge;
        this.halfEdges[nextHalfEdge.id] = nextHalfEdge;

        return [ currentHalfEdge, previousHalfEdge, nextHalfEdge, currentTwinHalfEdge, previousTwinHalfEdge, nextTwinHalfEdge ];
    }

    override createVertex(point: IConvexPoint): Vertex {
        const vertex = new Vertex(`${point.number}`, [point.x, point.y, point.z], null);

        return vertex;
    }

    public removeFacesByIds(faceIds: string[]) {
        faceIds.forEach(faceId => {
            const targetFace = this.faces[faceId];
            const halfEdge = targetFace.outerComponent;
            const nextHalfEdge = halfEdge.next;
            const prevHalfEdge = halfEdge.prev;

            delete this.faces[faceId];
            delete this.halfEdges[halfEdge.id];
            delete this.halfEdges[nextHalfEdge.id];
            delete this.halfEdges[prevHalfEdge.id];

            // to do delete vertexes

        });
    }

    public removeFaceById(faceId: string) {
        const targetFace = this.faces[faceId];
        const halfEdge = targetFace.outerComponent;
        const nextHalfEdge = halfEdge.next;
        const prevHalfEdge = halfEdge.prev;

        delete this.faces[faceId];
        delete this.halfEdges[halfEdge.id];
        delete this.halfEdges[nextHalfEdge.id];
        delete this.halfEdges[prevHalfEdge.id];

        // to do delete vertexes

    }

    public addPoint(point: IConvexPoint, boundaryHalfEdges: IConvexHalfEdge[]) {
        boundaryHalfEdges.forEach(halfEdge => {
            const vertex1 = halfEdge.origin;
            const vertex2 = halfEdge.twin.origin;
            
            this.createTopology(point, vertex1.toPoint(), vertex2.toPoint());
        })
    }

    public addPointByBoundary(point: IConvexPoint, boundaryHalfEdge: IConvexHalfEdge) {
        const vertex1 = boundaryHalfEdge.origin;
        const vertex2 = boundaryHalfEdge.twin.origin;
        this.createTopology(point, vertex1.toPoint(), vertex2.toPoint());
        const faceId = `${point.number}-${vertex1.id}-${vertex2.id}`;
        return this.faces[faceId];
    }
}
