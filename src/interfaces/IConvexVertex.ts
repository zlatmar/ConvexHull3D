import { IConvexPoint } from "./IConvexPoint";
import { IVertex } from "./IVertex";

export interface IConvexVertex extends IVertex {
    toPoint(): IConvexPoint;
}