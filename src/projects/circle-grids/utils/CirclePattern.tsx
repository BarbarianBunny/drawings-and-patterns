import { Circle, Layout, LayoutProps, Line } from "@motion-canvas/2d";
import {
  Color,
  Logger,
  PossibleVector2,
  Reference, ThreadGenerator,
  TimingFunction,
  Vector2,
  all,
  chain,
  createRef,
  createRefArray,
  easeOutQuad,
  linear
} from "@motion-canvas/core";

export interface CirclePatternProps extends LayoutProps {
  // patternSize?: SignalValue<number>;
}

export class CirclePattern extends Layout {
  // Containers
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
  patternSize: number;
  unit: number = 10;
  patternWidth: number;
  dotSize: number = 4;
  dotColor: Color = new Color("grey");
  dotMoveTime: number = 0.5;
  dotMoveTimingFn: TimingFunction = linear;
  dotOpacityTimingFn: TimingFunction = easeOutQuad;
  outerDotDiffs: Vector2[];
  outerDotPos: Vector2[];
  // Debug
  logger: Console | Logger;

  public constructor(
    size: number,
    logger: Console | Logger,
    props?: CirclePatternProps
  ) {
    super({ ...props });
    this.patternSize = size;
    if (this.patternSize % 2 !== 0) {
      this.position(new Vector2(-5));
    } else {
      this.position(new Vector2(0));
    }

    this.logger = logger;
    this.outerDotDiffs = this.calcOuterDotDiffs();
    this.patternWidth = this.calcPatternWidth();
    this.outerDotPos = this.calcOuterDotPos();

    this.add(
      <>
        <Layout ref={this.dotContainer}></Layout>
        <Layout ref={this.lineContainer}></Layout>
      </>
    );
  }

  // Return an array of pos differences between outer dots
  // Starts at the top middle left dot
  private calcOuterDotDiffs(): Vector2[] {
    const diffs = [new Vector2(this.patternSize, 0)];
    function lastDiff(): Vector2 {
      return diffs[diffs.length - 1];
    }

    while (lastDiff().y < this.patternSize) {
      diffs.push(lastDiff().addY(1));
    }
    while (lastDiff().x > -this.patternSize) {
      diffs.push(lastDiff().addX(-1));
    }
    while (lastDiff().y > -this.patternSize) {
      diffs.push(lastDiff().addY(-1));
    }
    while (lastDiff().x < this.patternSize) {
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
  private calcPatternWidth(): number {
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
  private calcOuterDotPos(): Vector2[] {
    const pos: Vector2[] = [
      new Vector2(
        (this.patternSize / 2) * -this.unit,
        (this.patternWidth / 2) * -this.unit
      ),
    ];
    this.outerDotDiffs.forEach((vector) => {
      pos.push(pos[pos.length - 1].add(vector.scale(this.unit)));
    });
    return pos;
  }

  public *animateOuterDots(time: number = this.dotMoveTime): ThreadGenerator {
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

  public *animateInnerDots(time: number = this.dotMoveTime): ThreadGenerator {
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

  private createDot(ref: Reference<Circle>, pos: Vector2) {
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

  private animateOutToIn(
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
