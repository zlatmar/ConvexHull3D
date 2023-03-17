import IConvexFace from "./IConvexFace";
import { IConvexVertex } from "./IConvexVertex";

export interface IHalfEdge {
    id: string,
    origin: IConvexVertex;
    twin: IHalfEdge;
    incidentFace: IConvexFace;
    next: IHalfEdge;
    prev: IHalfEdge;
}