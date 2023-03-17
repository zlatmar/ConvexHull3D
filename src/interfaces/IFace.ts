import { IHalfEdge } from "./IHalfEdge";

export interface IFace {
    id: string;
    outerComponent: IHalfEdge;
    innerComponents: IHalfEdge[] | null;
};
