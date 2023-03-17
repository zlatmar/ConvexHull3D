import { IHalfEdge } from "./IHalfEdge";

export interface IVertex {
    id: string;
    coordinates: number[];
    incidentEdge: IHalfEdge | null;
}