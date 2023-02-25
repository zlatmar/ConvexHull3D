import { IFace } from "./IFace";
import { IPoint3D } from "./IPoint3D";
import { IVector } from "./IVector";

export default interface IConvexFace extends IFace {
    getNormal(): IVector;
    projectPointOnFace(point: IPoint3D): IVector;
}