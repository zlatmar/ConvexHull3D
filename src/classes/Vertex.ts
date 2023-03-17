import { IConvexPoint, IHalfEdge, IConvexVertex } from "../interfaces";

export default class Vertex implements IConvexVertex {
    id: string;
    coordinates: number[];
    incidentEdge: IHalfEdge | null;

    constructor(id: string, coordinates: number[], incidentEdge: IHalfEdge | null) {
        this.id = id;
        this.coordinates = coordinates;
        this.incidentEdge = incidentEdge;
    }

    public toPoint() {
        const point: IConvexPoint = {
            number: +this.id,
            x: this.coordinates[0],
            y: this.coordinates[1],
            z: this.coordinates[2],
        }
        return point
    }
}