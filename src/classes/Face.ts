import { IFace, IHalfEdge } from "../interfaces";

export default class Face implements IFace {
    id: string;
    outerComponent: IHalfEdge;
    innerComponent: IHalfEdge | null;

    constructor(id: string) {
        this.id = id;
    }
}
