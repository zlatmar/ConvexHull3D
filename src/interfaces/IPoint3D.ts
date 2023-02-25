import { IPoint } from "./IPoint";
import { IVector } from "./IVector";

export interface IPoint3D extends IPoint {
    toVector(): IVector;
};