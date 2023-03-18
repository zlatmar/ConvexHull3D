import Vertex from "../../DCEL/classes/Vertex";
import { IConvexPoint, IConvexVertex, IConvexHalfEdge } from "../interfaces";


export default class ConvexVertex extends Vertex implements IConvexVertex {

    declare incidentEdge: IConvexHalfEdge | null;

    constructor(id: string, coordinates: number[], incidentEdge: IConvexHalfEdge | null) {
        super(id, coordinates, incidentEdge);
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