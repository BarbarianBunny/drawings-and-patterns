import { Circle, Layout, LayoutProps, Line, Ray } from "@motion-canvas/2d";
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
  chain,
  createRef,
  createRefArray,
  easeOutQuad,
  linear,
  sequence,
  waitFor,
  waitUntil,
} from "@motion-canvas/core";

export interface CirclePatternProps extends LayoutProps {
  // patternSize?: SignalValue<number>;
}

export class CirclePattern extends Layout {
  // Containers
  dotContainer = createRef<Layout>();
  rayContainer = createRef<Layout>();
  // Lists
  outerDots = createRefArray<Circle>();
  innerDots = createRefArray<Circle>();
  public dots() {
    return [...this.outerDots, ...this.innerDots];
  }
  horizontalRay = createRefArray<Ray>();
  verticalRays = createRefArray<Ray>();
  diagonalDownRays = createRefArray<Ray>();
  diagonalUpRays = createRefArray<Ray>();
  public rays() {
    return [
      ...this.horizontalRay,
      ...this.verticalRays,
      ...this.diagonalDownRays,
      ...this.diagonalUpRays,
    ];
  }
  // Values
  patternSize: number;
  unit: number = 10;
  patternWidth: number;
  patternHorizontalWidth() {
    return 3 * this.patternSize ** 2;
  }
  patternDiagonalWidth() {
    return Math.sqrt(2 * (2 * this.patternSize ** 2) ** 2);
  }
  dotSize: number = 4;
  dotColor: Color = new Color("lightgray");
  dotMoveTime: number = 0.5;
  dotMoveTimingFn: TimingFunction = linear;
  dotOpacityTimingFn: TimingFunction = easeOutQuad;
  rayTimingFn: TimingFunction = linear;
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
    this.outerDotPos = this.calcOuterDotPos(true);

    this.add(
      <>
        <Layout ref={this.dotContainer}></Layout>
        <Layout ref={this.rayContainer}></Layout>
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
  private calcOuterDotPos(diagonalStart: boolean = false): Vector2[] {
    const positions: Vector2[] = [
      new Vector2(
        (this.patternSize / 2) * -this.unit,
        (this.patternWidth / 2) * -this.unit
      ),
    ];
    this.outerDotDiffs.forEach((vector) => {
      positions.push(
        positions[positions.length - 1].add(vector.scale(this.unit))
      );
    });

    const startPos = positions.length - this.patternSize;
    const diagonalPositions = [];
    for (let i = startPos; i < positions.length + startPos; i++) {
      diagonalPositions.push(positions[i % positions.length]);
    }

    if (diagonalStart) return diagonalPositions;
    else return positions;
  }

  public *animateOuterDotsClockwise(
    time: number = this.dotMoveTime
  ): ThreadGenerator {
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

  public *animateOuterDotsFromCenter(
    time: number = this.dotMoveTime,
    includeWaits: boolean = false
  ): ThreadGenerator {
    // Create invisible dots in the center
    this.outerDotPos.forEach(() => {
      let dot = this.createDot(this.outerDots, new Vector2(0));
      this.dotContainer().add(dot);
      dot.opacity(0);
    });
    // Make those dots visible over time
    yield* all(
      ...this.outerDots.map((dot, index) => {
        return dot.opacity(1, time);
      })
    );

    // Move the dots to their outer positions
    yield* sequence(
      time / 5,
      ...this.outerDotPos.map((vector, index) => {
        return this.outerDots[index].position(
          vector,
          time,
          this.dotMoveTimingFn
        );
      })
    );
  }

  private moveDotTo(
    dot: Circle,
    vector: Vector2,
    time: number
  ): ThreadGenerator {
    return all(dot.position(vector, time, this.dotMoveTimingFn));
  }

  private moveDotBy(
    dot: Circle,
    vector: PossibleVector2,
    time: number
  ): ThreadGenerator {
    dot.opacity(0);
    return all(
      dot.position(dot.position().add(vector), time, this.dotMoveTimingFn),
      dot.opacity(1, 0, this.dotOpacityTimingFn)
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
        ...left.map((dot) => {
          return this.animateOutToIn(dot, toRight, time, duplicates);
        })
      ),
      all(
        ...top.map((dot) => {
          return this.animateOutToIn(dot, toBottom, time, duplicates);
        })
      ),
      all(
        ...topLeft.map((dot) => {
          return this.animateOutToIn(dot, toBottomRight, time, duplicates);
        })
      ),
      all(
        ...topRight.map((dot) => {
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
          chain(this.moveDotBy(clone, direction, time), clone.opacity(0, 0))
        );
      } else {
        actions.push(this.moveDotBy(clone, direction, time));
        this.innerDots.push(clone);
      }
      clone = clone.clone();
      clone.position(clone.position().add(direction));
      this.dotContainer().add(clone);
    }
    duplicates.push(clone);
    actions.push(
      chain(this.moveDotBy(clone, direction, time), clone.opacity(0, 0))
    );
    return chain(...actions);
  }

  private createRay(ref: Reference<Ray>, startPos: Vector2, endPos: Vector2) {
    return (
      <Ray
        ref={ref}
        from={startPos}
        to={endPos}
        lineWidth={this.dotSize / 2}
        lineCap={"round"}
        stroke={this.dotColor}
        start={0}
        end={0}
      ></Ray>
    );
  }

  *animateRays(
    rayRefs: ReferenceArray<Ray>,
    direction: PossibleVector2,
    time: number = 2
  ) {
    this.dots().forEach((dot) => {
      let startPos = dot.position();
      let endPos = startPos.add(direction);
      if (this.dots().some((dot) => dot.position().equals(endPos))) {
        this.rayContainer().add(this.createRay(rayRefs, startPos, endPos));
      }
    });

    yield* all(
      ...rayRefs.map((ray) => {
        return ray.start(1, time, this.rayTimingFn);
      })
    );
  }

  *animateRaysHorizontal(time: number) {
    yield* this.animateRays(this.horizontalRay, [this.unit, 0], time);
  }

  *animateRaysVertical(time: number) {
    yield* this.animateRays(this.verticalRays, [0, this.unit], time);
  }

  *animateRaysDiagonalDown(time: number) {
    yield* this.animateRays(this.verticalRays, [this.unit, this.unit], time);
  }

  *animateRaysDiagonalUp(time: number) {
    yield* this.animateRays(this.verticalRays, [-this.unit, this.unit], time);
  }

  *animateRaysH(time: number) {
    yield* all(
      this.animateHideDots(time * 2),
      chain(this.animateRaysHorizontal(time), this.animateRaysVertical(time))
    );
  }

  *animateRaysD(time: number) {
    yield* all(
      this.animateHideDots(time * 2),
      chain(
        this.animateRaysDiagonalDown(time),
        this.animateRaysDiagonalUp(time)
      )
    );
  }

  *animateRaysM(time: number) {
    yield* all(
      this.animateHideDots(time * 2),
      chain(
        all(
          this.animateRaysHorizontal(time),
          this.animateRaysDiagonalDown(time)
        ),
        all(this.animateRaysVertical(time), this.animateRaysDiagonalUp(time))
      )
    );
  }
  *animateHideDots(time: number = 2) {
    yield* all(
      ...this.dots().map((dot) => dot.opacity(0, time, this.dotMoveTimingFn))
    );
    this.dots().forEach((dot) => dot.remove().dispose());
  }
}
