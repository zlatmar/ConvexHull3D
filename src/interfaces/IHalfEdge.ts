import IConvexFace from "./IConvexFace";
import { IVertex } from "./IVertex";

export interface IHalfEdge {
    id: string,
    origin: IVertex;
    twin: IHalfEdge;
    incidentFace: IConvexFace;
    next: IHalfEdge;
    prev: IHalfEdge;
}