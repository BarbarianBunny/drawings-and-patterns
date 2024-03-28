import { Circle, Layout, Line, Rect, makeScene2D } from "@motion-canvas/2d";
import {
  Color,
  Logger,
  Reference,
  ThreadGenerator,
  TimingFunction,
  Vector2,
  all,
  chain,
  createRef,
  createRefArray,
  easeOutQuad,
  easeOutQuart,
  useLogger,
} from "@motion-canvas/core";

export default makeScene2D(function* (view) {
  //#region variables
  const logger = useLogger();
  const circle1 = new CirclePattern(1, logger);
  view.add(circle1.pattern());
  yield* circle1.animateOuterDots();
  //#endregion
});

class CirclePattern {
  // Containers
  pattern() {
    return (
      <Layout ref={this.container}>
        <Layout ref={this.dotContainer}></Layout>
        <Layout ref={this.lineContainer}></Layout>
      </Layout>
    );
  }
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
  spacing: number = 200;
  width: number;
  dotSize: number = 50;
  dotColor: Color = new Color("grey");
  dotTiming: number = 1;
  dotTimingFunction: TimingFunction = easeOutQuad;
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

  *animateOuterDots(): ThreadGenerator {
    yield* chain(
      ...this.outerDotPos.map((vector, index) => {
        if (index == 0) {
          this.dotContainer().add(this.createDot(this.outerDots, vector));
        } else {
          this.dotContainer().add(
            this.createDot(this.outerDots, this.outerDotPos[index - 1])
          );
        }
        return all(
          this.outerDots[index].position(
            vector,
            this.dotTiming,
            this.dotTimingFunction
          ),
          this.outerDots[index].opacity(
            1,
            this.dotTiming - 0.2,
            this.dotTimingFunction
          )
        );
      })
    );
  }

  createDot(ref: Reference<Circle>, pos: Vector2) {
    return (
      <Circle
        ref={ref}
        position={pos}
        size={this.dotSize}
        fill={this.dotColor}
        opacity={0}
      ></Circle>
    );
  }
}
