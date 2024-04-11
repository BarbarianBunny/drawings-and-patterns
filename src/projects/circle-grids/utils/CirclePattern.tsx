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
  loop,
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

  public *animateInnerDots(time: number = 2): ThreadGenerator {
    const left = this.outerDots.filter((dot) => dot.x() < 0);
    const toRight: PossibleVector2 = [this.unit, 0];
    const topLeft = this.outerDots.filter((dot) => dot.y() < -dot.x());
    const toBottomRight: PossibleVector2 = [this.unit, this.unit];
    const top = this.outerDots.filter((dot) => dot.y() < 0);
    const toBottom: PossibleVector2 = [0, this.unit];
    const topRight = this.outerDots.filter((dot) => dot.y() < dot.x());
    const toBottomLeft: PossibleVector2 = [-this.unit, this.unit];
    this.logger.info("New Dots?");

    const duplicates: Circle[] = [];
    // Animate Left to Right
    yield* chain(
      all(
        ...left.map((dot) => {
          return this.animateFrom(dot, toRight, time/this.patternHorizontalWidth(), duplicates);
        })
      ),
      all(
        ...top.map((dot) => {
          return this.animateFrom(dot, toBottom, time/this.patternHorizontalWidth(), duplicates);
        })
      ),
      all(
        ...topLeft.map((dot) => {
          return this.animateFrom(dot, toBottomRight, time/this.patternDiagonalWidth(), duplicates);
        })
      ),
      all(
        ...topRight.map((dot) => {
          return this.animateFrom(dot, toBottomLeft, time/this.patternDiagonalWidth(), duplicates);
        })
      )
    );

    duplicates.forEach((dot) => {
      dot.remove().dispose();
    });
  }

  private createDot(ref: Reference<Circle>, pos: Vector2, opacity: number = 1) {
    return (
      <Circle
        ref={ref}
        position={pos}
        size={this.dotSize}
        fill={this.dotColor}
        opacity={opacity}
      ></Circle>
    );
  }

  private animateFrom(
    dot: Circle,
    direction: PossibleVector2,
    time: number,
    duplicates: Circle[]
  ): ThreadGenerator {
    const actions: ThreadGenerator[] = []; // [all(), all()]
    // return chain(...actions); at end

    let clone = dot.clone();
    let pos = dot.position().add(direction);
    this.dotContainer().add(clone);

    // First move from outerDot pos to next spot
    actions.push(clone.position(pos, time, linear));

    // While it hasn't reached an outerDot then loop
    while (
      !this.outerDots.some((outerDot) => outerDot.position().equals(pos))
    ) {
      let loopActions: ThreadGenerator[] = [];
      this.logger.info("Inner Pos");
      // If a dot already exists there
      if (!this.dots().some((anyDot) => anyDot.position().equals(pos))) {
        this.logger.info("Create");
        // If a dot doesn't already exist then create new dot
        let newDot = this.createDot(this.innerDots, pos, 0);
        this.dotContainer().add(newDot);
        loopActions.push(newDot.opacity(1, 0));
      } else {
        // Dot already exists
        this.logger.info("Exists");
      }
      // update position and clone
      pos = pos.add(direction);
      loopActions.push(clone.position(pos, time, linear));
      actions.push(all(...loopActions));
    }

    // After reaching an outerDot send it to be deleted and send chained actions
    this.logger.info("Last Pos");
    duplicates.push(clone);
    return chain(...actions);
  }

  private createRay(
    ref: Reference<Ray>,
    startPos: Vector2,
    endPos: Vector2,
    start: number = 0,
    end: number = 0
  ) {
    return (
      <Ray
        ref={ref}
        from={startPos}
        to={endPos}
        lineWidth={this.dotSize / 2}
        lineCap={"round"}
        stroke={this.dotColor}
        start={start}
        end={end}
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

    // // Extend every ray in direction as available
    // rayRefs.forEach(ray => {
    //   while (rayRefs.some(value => {value.from().equals(ray.to())})){
    //     ray.to(ray.to().add(direction))
    //   }
    // })
    // // Only keep the longest ray of each matching to()
    // rayRefs.forEach(ray => {
    //   if (rayRefs.some(value => {value.to().equals(ray.to()) && rayLen(value) > rayLen(ray)})){
    //     ray.remove().dispose()
    //   }
    // })
    // function rayLen(ray: Ray){
    //   return Math.sqrt((ray.from().x - ray.to().x)**2 + (ray.from().y - ray.to().y)**2)
    // }
    // // Simplify after animation
    // // get list of positions of all dots
    // const positions = this.dots().map((dot) => dot.position());
    // // remove old rays
    // rayRefs.forEach(ray => ray.remove().dispose())

    // // while: it's not empty
    // while (positions.length > 0) {
    //   let startPos = positions.pop();
    //   let endPos = startPos;
    //   // Find end
    //   while (positions.includes(endPos.add(direction))) {
    //     let index = positions.findIndex((pos) =>
    //       pos.equals(endPos.add(direction))
    //     );
    //     positions.splice(index, 1);
    //     endPos = endPos.add(direction);
    //   }
    //   // Find start
    //   let dir = direction as number[];
    //   while (
    //     positions.includes(startPos.add(new Vector2(dir[0] * -1, dir[1] * -1)))
    //   ) {
    //     let index = positions.findIndex((pos) =>
    //       pos.equals(startPos.add(new Vector2(dir[0] * -1, dir[1] * -1)))
    //     );
    //     positions.splice(index, 1);
    //     startPos = startPos.add(new Vector2(dir[0] * -1, dir[1] * -1));
    //   }
    //   if (!startPos.equals(endPos)){
    //     this.rayContainer().add(this.createRay(rayRefs, startPos, endPos, 1))
    //   }
    // }
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
