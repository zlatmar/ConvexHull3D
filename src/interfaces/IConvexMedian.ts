import { IPoint } from "./IPoint";

export interface IConvexMedian {
    addPoint(point: IPoint): void;
    getMedianPoint(): IPoint;
};
