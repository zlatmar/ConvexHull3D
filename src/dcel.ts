// Doubly connected edge list
import ConvexFace from "./classes/ConvexFace";
import HalfEdge from "./classes/HalfEdge";
import Vertex from "./classes/Vertex";
import { IConvexPoint, IEdge, IHalfEdge } from "./interfaces";

export default class DCEL {

    vertexes: { [id: string]: Vertex } = {};

    faces: { [id: string]: ConvexFace } = {};

    halfEdges: { [id: string]: IHalfEdge } = {};

    removedFaces: { [id: string]: ConvexFace } = {};

    // initialize from tetrahedron
    // The array of points must consist of four initial points
    constructor(points: IConvexPoint[]) {
        const p1 = points[0];
        const p2 = points[1];
        const p3 = points[2];
        const p4 = points[3];

        this.createTopology(p1, p2, p4);
        this.createTopology(p3, p1, p4);
        this.createTopology(p2, p3, p4);
        this.createTopology(p3, p2, p1);

        // const halfEdgesOfFace1 = this.createHalfEdges(p1, p2, p3);
        // const halfEdgesOfFace2 = this.createHalfEdges(p1, p2, p4);
        // const halfEdgesOfFace3 = this.createHalfEdges(p1, p3, p4);
        // const halfEdgesOfFace4 = this.createHalfEdges(p2, p3, p4);

        // const allHalfEdges = halfEdgesOfFace1.concat(halfEdgesOfFace2).concat(halfEdgesOfFace3).concat(halfEdgesOfFace4);
    }

    private getVertex(point: IConvexPoint) {
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
        const face = this.createFace(point1, point2, point3);
        this.faces[face.id] = face;

        // 3. Create Half edges
        this.createHalfEdges(point1, point2, point3)
    }

    private createFace(point1: IConvexPoint, point2: IConvexPoint, point3: IConvexPoint) {
        return new ConvexFace(point1, point2, point3);
    }

    private getHalfEdge(edgePoints: IEdge, face: ConvexFace | null) {
        const halfEdgeId = `${edgePoints.firstEdgePoint.number}-${edgePoints.secondEdgePoint.number}`;
        const halfEdge = this.halfEdges[halfEdgeId];
        if (halfEdge) {
            if (face && !halfEdge.incidentFace) halfEdge.incidentFace = face;
            return halfEdge;
        } else {
            const newHalfEdge = new HalfEdge(edgePoints.firstEdgePoint, edgePoints.secondEdgePoint, face) //this.createHalfEdge(edgePoints, facePoint);
            this.halfEdges[newHalfEdge.id] = newHalfEdge;
            return newHalfEdge;
        }
    }

    private getHalfEdgeById(halfEdgeId: string): IHalfEdge | null {
        return this.halfEdges[halfEdgeId] || null;
    }

    private getFaceById(faceId: string) {
        return this.faces[faceId];
    }

    private createHalfEdges(facePoint1: IConvexPoint, facePoint2: IConvexPoint, facePoint3: IConvexPoint) {
        const faceId = `${facePoint1.number}-${facePoint2.number}-${facePoint3.number}`; // join('');
        const face = this.getFaceById(faceId);
        
        const currentHalfEdge = this.getHalfEdge({ firstEdgePoint: facePoint1, secondEdgePoint: facePoint2 }, face) //new HalfEdge(facePoint1, facePoint2, face);
        currentHalfEdge.origin = this.getVertex(facePoint1);
        face.outerComponent = currentHalfEdge;

        const previousHalfEdge = this.getHalfEdge({ firstEdgePoint: facePoint3, secondEdgePoint: facePoint1 }, face) // new HalfEdge(facePoint3, facePoint1, face);
        previousHalfEdge.origin = this.getVertex(facePoint3);

        const nextHalfEdge = this.getHalfEdge({ firstEdgePoint: facePoint2, secondEdgePoint: facePoint3 }, face) // new HalfEdge(facePoint2, facePoint3, face);
        nextHalfEdge.origin = this.getVertex(facePoint2);

        const currentTwinHalfEdge = this.getHalfEdgeById(`${facePoint2.number}-${facePoint1.number}`); // this.getHalfEdge({ firstPoint: facePoint2, secondPoint: facePoint1 }, null) // new HalfEdge(facePoint2, facePoint1, face);
        if (currentTwinHalfEdge) {
            currentTwinHalfEdge.origin = this.getVertex(facePoint2);
        }

        const previousTwinHalfEdge = this.getHalfEdgeById(`${facePoint1.number}-${facePoint3.number}`); // this.getHalfEdge({ firstPoint: facePoint1, secondPoint: facePoint3 }, null) // new HalfEdge(facePoint1, facePoint3, face);
        if (previousTwinHalfEdge) {
            previousTwinHalfEdge.origin = this.getVertex(facePoint1);
        }

        const nextTwinHalfEdge = this.getHalfEdgeById(`${facePoint3.number}-${facePoint2.number}`); // this.getHalfEdge({ firstPoint: facePoint3, secondPoint: facePoint2 }, null) // new HalfEdge(facePoint3, facePoint2, face);
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

    private createVertex(point: IConvexPoint): Vertex {
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

    public removeFacesById(faceId: string) {
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

    public addPoint(point: IConvexPoint, boundaryHalfEdges: IHalfEdge[]) {
        boundaryHalfEdges.forEach(halfEdge => {
            const vertex1 = halfEdge.origin;
            const vertex2 = halfEdge.twin.origin;
            // const faceId = [point.number, vertex1.toPoint().number, vertex2.toPoint().number].join('');
            
            this.createTopology(point, vertex1.toPoint(), vertex2.toPoint());
        })
    }

    public addPointByBoundary(point: IConvexPoint, boundaryHalfEdge: IHalfEdge) {
        const vertex1 = boundaryHalfEdge.origin;
        const vertex2 = boundaryHalfEdge.twin.origin;
        this.createTopology(point, vertex1.toPoint(), vertex2.toPoint());
        const faceId = `${point.number}-${vertex1.id}-${vertex2.id}`;
        return this.faces[faceId];
    }
}
