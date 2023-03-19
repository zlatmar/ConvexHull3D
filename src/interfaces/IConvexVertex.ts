import { IConvexHalfEdge } from "./IConvexHalfEdge";
import { IConvexPoint } from "./IConvexPoint";
import { IVertex } from "../../DCEL/intefaces";

export interface IConvexVertex extends Omit<IVertex, 'incidentEdge'> {
    incidentEdge: IConvexHalfEdge | null;
    toPoint(): IConvexPoint;
}