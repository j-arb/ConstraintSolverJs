export class Body {
    private id: String;
    public x: number;
    public y: number
    public theta: number;

    constructor(id: String, x: number, y: number, theta: number) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.theta = theta;
    }
}