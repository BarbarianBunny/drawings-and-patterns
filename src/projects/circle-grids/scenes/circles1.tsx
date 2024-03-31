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
  PossibleVector2,
  Reference,
  ReferenceArray,
  ThreadGenerator,
  TimingFunction,
  Vector2,
  all,
  any,
  chain,
  createRef,
  createRefArray,
  easeOutCirc,
  easeOutCubic,
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
  const circle1 = new CirclePattern(2, logger);
  //#endregion

  view.add(
    <Layout ref={page} scale={5}>
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
  unit: number = 10;
  width: number;
  dotSize: number = 4;
  dotColor: Color = new Color("grey");
  dotMoveTime: number = 0.5;
  dotMoveTimingFn: TimingFunction = linear;
  dotOpacityTimingFn: TimingFunction = easeOutQuad;
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
      new Vector2((this.size / 2) * -this.unit, (this.width / 2) * -this.unit),
    ];
    this.outerDotDiffs.forEach((vector) => {
      pos.push(pos[pos.length - 1].add(vector.scale(this.unit)));
    });
    return pos;
  }

  *animateOuterDots(time: number = this.dotMoveTime): ThreadGenerator {
    yield* chain(
      ...this.outerDotPos.map((vector, index) => {
        if (index == 0) {
          this.dotContainer().add(this.createDot(this.outerDots, vector));
        } else {
          this.dotContainer().add(
            this.createDot(this.outerDots, this.outerDotPos[index - 1])
          );
        }

        return this.moveDotTo(this.outerDots[index], vector, time);
      })
    );
  }

  private moveDotTo(
    dot: Circle,
    vector: Vector2,
    time: number
  ): ThreadGenerator {
    dot.opacity(0);
    return all(
      dot.position(vector, time, this.dotMoveTimingFn),
      dot.opacity(1, time - 0.2, this.dotOpacityTimingFn)
    );
  }
  private moveDot(
    dot: Circle,
    move: PossibleVector2,
    time: number
  ): ThreadGenerator {
    dot.opacity(0);
    return all(
      dot.position(dot.position().add(move), time, this.dotMoveTimingFn),
      dot.opacity(1, Math.max(time - 0.2, 0), this.dotOpacityTimingFn)
    );
  }
  *animateInnerDots(time: number = this.dotMoveTime): ThreadGenerator {
    const left = this.outerDots.filter((dot) => dot.x() < 0);
    const toRight: PossibleVector2 = [this.unit, 0];
    const topLeft = this.outerDots.filter((dot) => dot.y() < -dot.x());
    const toBottomRight: PossibleVector2 = [this.unit, this.unit];
    const top = this.outerDots.filter((dot) => dot.y() < 0);
    const toBottom: PossibleVector2 = [0, this.unit];
    const topRight = this.outerDots.filter((dot) => dot.y() < dot.x());
    const toBottomLeft: PossibleVector2 = [-this.unit, this.unit];

    const duplicates: Circle[] = [];
    // Animate Left to Right
    yield* chain(
      all(
        ...left.map((dot, index) => {
          return this.animateOutToIn(dot, toRight, time, duplicates);
        })
      ),
      all(
        ...top.map((dot, index) => {
          return this.animateOutToIn(dot, toBottom, time, duplicates);
        })
      ),
      all(
        ...topLeft.map((dot, index) => {
          return this.animateOutToIn(dot, toBottomRight, time, duplicates);
        })
      ),
      all(
        ...topRight.map((dot, index) => {
          return this.animateOutToIn(dot, toBottomLeft, time, duplicates);
        })
      )
    );

    duplicates.forEach((dot) => {
      dot.remove().dispose();
    });
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

  animateOutToIn(
    dot: Circle,
    direction: PossibleVector2,
    time: number,
    duplicates: Circle[]
  ): ThreadGenerator {
    const actions: ThreadGenerator[] = [];
    let clone = dot.clone();
    this.dotContainer().add(clone);
    while (
      !this.outerDots.some((outerDot: Circle) => {
        return outerDot.position().equals(clone.position().add(direction));
      })
    ) {
      if (
        this.dots().some((outerDot: Circle) => {
          outerDot.position().equals(clone.position().add(direction));
        })
      ) {
        duplicates.push(clone);
        actions.push(
          chain(this.moveDot(clone, direction, time), clone.opacity(0, 0))
        );
      } else {
        actions.push(this.moveDot(clone, direction, time));
        this.innerDots.push(clone);
      }
      clone = clone.clone();
      clone.position(clone.position().add(direction));
      this.dotContainer().add(clone);
    }
    duplicates.push(clone);
    actions.push(
      chain(this.moveDot(clone, direction, time), clone.opacity(0, 0))
    );
    return chain(...actions);
  }
}
