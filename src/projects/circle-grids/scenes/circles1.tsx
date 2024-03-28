import {
  Circle,
  Grid,
  Layout,
  Line,
  Rect,
  makeScene2D,
} from "@motion-canvas/2d";
import {
  Color,
  Logger,
  Reference,
  ReferenceArray,
  ThreadGenerator,
  TimingFunction,
  Vector2,
  all,
  chain,
  createRef,
  createRefArray,
  easeOutQuad,
  easeOutQuart,
  linear,
  useLogger,
} from "@motion-canvas/core";

export default makeScene2D(function* (view) {
  //#region variables
  const logger = useLogger();
  const spacing = 10;
  const page = createRef<Layout>();
  const grid = createRef<Grid>();
  const circle1 = new CirclePattern(1, logger);
  //#endregion

  view.add(
    <Layout ref={page} scale={10}>
      <Grid
        ref={grid}
        stroke={"grey"}
        lineWidth={0.2}
        width={"100%"}
        height={"100%"}
        spacing={spacing}
        start={0}
        end={1}
      ></Grid>
    </Layout>
  );
  page().absolutePosition(
    page()
      .absolutePosition()
      .add([-5 * spacing, -5 * spacing])
  );
  // Animate 1st Circle dot creation
  page().add(circle1.pattern());

  yield* circle1.animateOuterDots();
  yield* circle1.animateInnerDots();
});

class CirclePattern {
  // Containers
  pattern() {
    let pos: Vector2 = new Vector2(0);
    if (this.size % 2 !== 0) {
      pos = new Vector2(-5);
    }
    return (
      <Layout ref={this.container} position={pos}>
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
  spacing: number = 10;
  width: number;
  dotSize: number = 4;
  dotColor: Color = new Color("grey");
  dotTiming: number = 0.5;
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
        (this.size / 2) * -this.spacing,
        (this.width / 2) * -this.spacing
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

  *animateInnerDots(): ThreadGenerator {
    this.logger.info(this.outerDots.toString());
    const left = this.outerDots.filter((dot) => dot.x() < 0.1 * this.spacing);
    const topLeft = this.outerDots.filter(
      (dot) => dot.y() < -dot.x() + 0.1 * this.spacing
    );
    const top = this.outerDots.filter((dot) => dot.y() < 0.1 * this.spacing);
    const topRight = this.outerDots.filter((dot) => dot.y() < dot.x());
    this.logger.info(left.length.toString());
    this.logger.info(topLeft.length.toString());
    this.logger.info(top.length.toString());
    this.logger.info(topRight.length.toString());
    // Animate moving from top left to bottom right
    // Either disappearing when hitting an existing dot
    // Or creating a new dot
    // Moving dots go from 0 opacity to 1 each time just like the outer dots
  }
  *animateInnerDotsHorizontal(): ThreadGenerator {}
  *animateInnerDotsCombined(): ThreadGenerator {}

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
