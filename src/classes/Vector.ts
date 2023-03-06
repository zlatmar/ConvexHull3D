import { IPoint, IVector } from "../interfaces";

export default class Vector implements IVector {
    x: number;
    y: number;
    z: number;

    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    
    substract(vector: IPoint): Vector {
        return new Vector(this.x - vector.x, this.y - vector.y, this.z - vector.z);
    }

    scale(scalar: number): Vector {
        return new Vector(this.x * scalar, this.y * scalar, this.z * scalar);
    }

    dotProduct(vector: IPoint): number {
        return this.x * vector.x + this.y * vector.y + this.z * vector.z;
    }
}
