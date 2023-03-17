import { IFace, IHalfEdge } from "../interfaces";

export default class Face implements IFace {
    id: string;
    outerComponent: IHalfEdge;
    innerComponents: IHalfEdge[] | null;

    constructor(id: string) {
        this.id = id;
    }
}
