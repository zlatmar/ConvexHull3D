import { IConvexHalfEdge } from "./IConvexHalfEdge";
import { IConvexPoint } from "./IConvexPoint";
import { IVertex } from "./IVertex";

export interface IConvexVertex extends Omit<IVertex, 'incidentEdge'> {
    incidentEdge: IConvexHalfEdge | null;
    toPoint(): IConvexPoint;
}