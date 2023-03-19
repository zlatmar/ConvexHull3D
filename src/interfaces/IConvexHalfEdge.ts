import { IHalfEdge } from "../../DCEL/intefaces";
import { IConvexFace } from "./IConvexFace";
import { IConvexVertex } from "./IConvexVertex";

export interface IConvexHalfEdge extends IHalfEdge {
    id: string,
    origin: IConvexVertex;
    twin: IConvexHalfEdge;
    incidentFace: IConvexFace;
    next: IConvexHalfEdge;
    prev: IConvexHalfEdge;
}