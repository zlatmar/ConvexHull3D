import { IPoint } from "./IPoint";

export interface IVector extends IPoint {
    substract(vector: IPoint): IVector;
    scale(scalar: number): IVector;
    dotProduct(vector: IPoint): number;
};