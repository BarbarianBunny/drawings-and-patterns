import { Circle, Layout, Line, makeScene2D } from "@motion-canvas/2d";
import {
  Color,
  Logger,
  Vector2,
  createRef,
  createRefArray,
  useLogger,
} from "@motion-canvas/core";

export default makeScene2D(function* (view) {
  //#region variables
  const logger = useLogger();
  const circle1 = new CirclePattern(1, logger);
  //#endregion
});

class CirclePattern {
  // Containers
  container = createRef<Layout>();
  dotContainer = createRef<Layout>();
  lineContainer = createRef<Layout>();
  // Lists
  outerDots = createRefArray<Circle>();
  innerDots = createRefArray<Circle>();
  public dots() {
    return [...this.outerDots, ...this.innerDots];
  }
  lines = createRefArray<Line>();
  // Values
  size: number;
  spacing: number = 10;
  width: number;
  dotSize: number = 1;
  dotColor: Color = new Color("grey");
  outerDotDiffs: Vector2[];
  outerDotPos: Vector2[];
  // Debug
  logger: Console | Logger;

  public constructor(size: number, logger: Console | Logger) {
    this.logger = logger;
    this.size = size;
    this.outerDotDiffs = this.calcOuterDotDiffs();
    this.width = this.calcPatternWidth();
    this.outerDotPos = this.calcOuterDotPos();
    this.generateOuterDots();

    <Layout ref={this.container}>
      <Layout ref={this.dotContainer}></Layout>
      <Layout ref={this.lineContainer}></Layout>
    </Layout>;
  }

  // Return an array of pos differences between outer dots
  // Starts at the top middle left dot
  calcOuterDotDiffs(): Vector2[] {
    const diffs = [new Vector2(this.size, 0)];
    function lastDiff(): Vector2 {
      return diffs[diffs.length - 1];
    }

    while (lastDiff().y < this.size) {
      diffs.push(lastDiff().addY(1));
    }
    while (lastDiff().x > -this.size) {
      diffs.push(lastDiff().addX(-1));
    }
    while (lastDiff().y > -this.size) {
      diffs.push(lastDiff().addY(-1));
    }
    while (lastDiff().x < this.size) {
      diffs.push(lastDiff().addX(1));
    }
    while (lastDiff().y < -1) {
      diffs.push(lastDiff().addY(1));
    }
    diffs.pop();
    return diffs;
  }

  // Returns the pattern's base width
  // Based on the diff steps from rightest dot to leftest dot
  calcPatternWidth(): number {
    const x = this.outerDotDiffs.map(function (value) {
      return value.x;
    });
    const negatives = x.filter(function (a) {
      return a < 0;
    });
    const sum = negatives.reduce(function (a, b) {
      return a + b;
    });
    return Math.abs(sum);
  }

  // Returns the pattern's outer dot's positions
  // Accounts for spacing between dots
  calcOuterDotPos(): Vector2[] {
    const pos: Vector2[] = [
      new Vector2(
        Math.floor(this.size / 2) * -this.spacing,
        Math.floor(this.width / 2) * -this.spacing
      ),
    ];
    this.outerDotDiffs.forEach((vector) => {
      pos.push(pos[pos.length - 1].add(vector.scale(this.spacing)));
    });
    return pos;
  }

  // generateOuterDots(): void {
  //   this.outerDotPos.forEach((vector, index) => {

  //     <Circle
  //       ref={this.outerDots}
  //       position={}
  //       size={this.dotSize}
  //       fill={this.dotColor}
  //     ></Circle>;
  //   });
  // }
  // newDot(pos){

  // }
}
