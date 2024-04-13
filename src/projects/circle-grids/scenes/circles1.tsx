import { Grid, Layout, makeScene2D } from "@motion-canvas/2d";
import {
  PossibleVector2,
  all,
  createRef,
  delay,
  linear,
  sequence,
  useLogger,
  waitFor,
  waitUntil,
} from "@motion-canvas/core";
import { CirclePattern } from "../utils/CirclePattern";

export default makeScene2D(function* (view) {
  //#region variables
  const logger = useLogger();
  const debug = true;
  const maxStages = 5;
  // Values
  const unit = 10;
  const unitDiagonal = Math.sqrt(2 * unit ** 2);
  function diagonalScale(y: number) {
    return 1080 / (y * unitDiagonal);
  }
  function dir(x: number, y: number) {
    return [x * unit, y * unit] as PossibleVector2<number>;
  }
  function pageDir(y: number, scale: number) {
    return [0, scale * unitDiagonal * y] as PossibleVector2<number>;
  }
  // References
  const page = createRef<Layout>();
  const grid = createRef<Grid>();
  // Class
  const circles: CirclePattern[] = [];
  //#endregion

  view.add(
    <Layout
      ref={page}
      position={pageDir(0.5, diagonalScale(4))}
      scale={diagonalScale(4)}
      rotation={45}
    >
      <Grid
        ref={grid}
        stroke={"3c3c3c"}
        lineWidth={0.2}
        width={"500%"}
        height={"500%"}
        spacing={unit}
        start={0}
        end={1}
      ></Grid>
    </Layout>
  );

  //#region circles 1
  if (maxStages >= 1) {
    circles[0] = new CirclePattern(1, logger);
    circles[1] = new CirclePattern(1, logger);
    circles[2] = new CirclePattern(1, logger);

    page().add(circles[0]);
    page().add(circles[1]);
    page().add(circles[2]);

    yield* waitUntil("Outer1");
    yield* circles[0].animateOuterDotsFromCenter(0.4, true);

    yield* waitUntil("Inner1");
    if (!debug) {
      yield* circles[0].animateInnerDots();
    }

    yield* waitUntil("Spread1");
    yield* all(
      circles[1].animateOuterDotsFromCenter(0),
      circles[2].animateOuterDotsFromCenter(0)
    );
    if (!debug) {
      yield* all(
        circles[1].animateInnerDots(0),
        circles[2].animateInnerDots(0)
      );
    }

    yield* all(
      circles[0].position(circles[0].position().add(dir(0, 3)), 2, linear),
      circles[1].position(circles[1].position().add(dir(-1, -1)), 2, linear),
      circles[2].position(circles[2].position().add(dir(3, 0)), 2, linear),
      page().scale(diagonalScale(6.5), 2, linear),
      page().position(pageDir(0.25, diagonalScale(6.5)), 2, linear)
    );

    yield* waitUntil("Rays1");
    if (!debug) {
      yield* all(
        circles[0].animateRaysH(2),
        circles[1].animateRaysD(2),
        circles[2].animateRaysM(2)
      );
    }
  }
  //#endregion

  //#region circles 2
  if (maxStages >= 2) {
    circles[3] = new CirclePattern(2, logger);
    circles[4] = new CirclePattern(2, logger);
    circles[5] = new CirclePattern(2, logger);

    page().add(circles[3]);
    page().add(circles[4]);
    page().add(circles[5]);

    yield* waitUntil("Outer2");
    yield* all(
      circles[0].position(circles[0].position().add(dir(-2, 6)), 2, linear),
      circles[1].position(circles[1].position().add(dir(-5, -5)), 2, linear),
      circles[2].position(circles[2].position().add(dir(6, -2)), 2, linear),
      page().scale(diagonalScale(13.5), 2, linear),
      page().position(pageDir(1.75, diagonalScale(13.5)), 2, linear),
      delay(1, circles[3].animateOuterDotsFromCenter(0.5, true))
    );

    yield* waitUntil("Inner2");
    if (!debug) {
      yield* circles[3].animateInnerDots();
    }

    yield* waitUntil("Spread2");
    yield* all(
      circles[4].animateOuterDotsFromCenter(0),
      circles[5].animateOuterDotsFromCenter(0)
    );
    if (!debug) {
      yield* all(
        circles[4].animateInnerDots(0),
        circles[5].animateInnerDots(0)
      );
    }

    yield* all(
      circles[3].position(circles[3].position().add(dir(-7, 2)), 2, linear),
      circles[4].position(circles[4].position().add(dir(2, -7)), 2, linear),
      circles[5].position(circles[5].position().add(dir(5, 5)), 2, linear),
      page().scale(diagonalScale(18.5), 2, linear),
      page().position(pageDir(-0.75, diagonalScale(18.5)), 2, linear)
    );

    yield* waitUntil("Rays2");
    if (!debug) {
      yield* all(
        circles[3].animateRaysH(2),
        circles[4].animateRaysD(2),
        circles[5].animateRaysM(2)
      );
    }
  }
  //#endregion

  //#region circles 3
  if (maxStages >= 3) {
    circles[6] = new CirclePattern(3, logger);
    circles[7] = new CirclePattern(3, logger);
    circles[8] = new CirclePattern(3, logger);

    page().add(circles[6]);
    page().add(circles[7]);
    page().add(circles[8]);

    yield* waitUntil("Outer3");
    yield* all(
      ...circles.map((circle, index) => {
        if (index > 5) return;
        switch (index) {
          case 0:
            return circle.position(
              circle.position().add(dir(-18, 5)),
              2,
              linear
            );
          case 3:
            return circle.position(
              circle.position().add(dir(-14, 3)),
              2,
              linear
            );
          case 1:
            return circle.position(
              circle.position().add(dir(4, -17)),
              2,
              linear
            );
          case 4:
            return circle.position(
              circle.position().add(dir(3, -14)),
              2,
              linear
            );
          case 2:
            return circle.position(
              circle.position().add(dir(12, 12)),
              2,
              linear
            );
          case 5:
            return circle.position(
              circle.position().add(dir(11, 11)),
              2,
              linear
            );
        }
      }),
      page().scale(diagonalScale(36), 2, linear),
      page().position(pageDir(-3, diagonalScale(36)), 2, linear),
      delay(1, circles[6].animateOuterDotsFromCenter(0.5, true))
    );

    yield* waitUntil("Inner3");
    if (!debug) {
      yield* circles[6].animateInnerDots();
    }

    yield* waitUntil("Spread3");
    yield* all(
      circles[7].animateOuterDotsFromCenter(0),
      circles[8].animateOuterDotsFromCenter(0)
    );
    if (!debug) {
      yield* all(
        circles[7].animateInnerDots(0),
        circles[8].animateInnerDots(0)
      );
    }

    yield* all(
      circles[6].position(circles[6].position().add(dir(-11, -11)), 2, linear),
      circles[7].position(circles[7].position().add(dir(15, -4)), 2, linear),
      circles[8].position(circles[8].position().add(dir(-4, 15)), 2, linear),
      page().scale(diagonalScale(42.5), 2, linear),
      page().position(pageDir(0.25, diagonalScale(42.5)), 2, linear)
    );

    yield* waitUntil("Rays3");
    if (!debug) {
      yield* all(
        circles[6].animateRaysH(2),
        circles[7].animateRaysD(2),
        circles[8].animateRaysM(2)
      );
    }
  }
  //#endregion

  //#region circles 4
  if (maxStages >= 4) {
    circles[9] = new CirclePattern(4, logger);
    circles[10] = new CirclePattern(4, logger);
    circles[11] = new CirclePattern(4, logger);

    page().add(circles[9]);
    page().add(circles[10]);
    page().add(circles[11]);

    yield* waitUntil("Outer4");
    yield* all(
      ...circles.map((circle, index) => {
        switch (index) {
          case 0:
            return circle.position(
              circle.position().add(dir(-25, -22)),
              2,
              linear
            );
          case 3:
            return circle.position(
              circle.position().add(dir(-23, -22)),
              2,
              linear
            );
          case 6:
            return circle.position(
              circle.position().add(dir(-19, -19)),
              2,
              linear
            );
          case 1:
            return circle.position(
              circle.position().add(dir(33, -11)),
              2,
              linear
            );
          case 4:
            return circle.position(
              circle.position().add(dir(32, -9)),
              2,
              linear
            );
          case 7:
            return circle.position(
              circle.position().add(dir(26, -6)),
              2,
              linear
            );
          case 2:
            return circle.position(
              circle.position().add(dir(-4, 36)),
              2,
              linear
            );
          case 5:
            return circle.position(
              circle.position().add(dir(-8, 31)),
              2,
              linear
            );
          case 8:
            return circle.position(
              circle.position().add(dir(-6, 26)),
              2,
              linear
            );
        }
      }),
      page().scale(diagonalScale(73.5), 2, linear),
      page().position(pageDir(3.75, diagonalScale(73.5)), 2, linear),
      delay(1, circles[9].animateOuterDotsFromCenter(0.5, true))
    );

    yield* waitUntil("Inner4");
    if (!debug) {
      yield* circles[9].animateInnerDots();
    }

    yield* waitUntil("Spread4");
    yield* all(
      circles[10].animateOuterDotsFromCenter(0),
      circles[11].animateOuterDotsFromCenter(0)
    );
    if (!debug) {
      yield* all(
        circles[10].animateInnerDots(0),
        circles[11].animateInnerDots(0)
      );
    }

    yield* all(
      circles[9].position(circles[9].position().add(dir(7, -26)), 2, linear),
      circles[10].position(circles[10].position().add(dir(20, 20)), 2, linear),
      circles[11].position(circles[11].position().add(dir(-26, 7)), 2, linear),
      page().scale(diagonalScale(77.5), 2, linear),
      page().position(pageDir(1.75, diagonalScale(77.5)), 2, linear)
    );

    yield* waitUntil("Rays4");
    if (!debug) {
      yield* all(
        circles[9].animateRaysH(2),
        circles[10].animateRaysD(2),
        circles[11].animateRaysM(2)
      );
    }
  }
  //#endregion

  //#region circles 5
  if (maxStages >= 5) {
    circles[12] = new CirclePattern(5, logger);
    circles[13] = new CirclePattern(5, logger);
    circles[14] = new CirclePattern(5, logger);

    page().add(circles[12]);
    page().add(circles[13]);
    page().add(circles[14]);

    yield* waitUntil("Outer5");
    yield* all(
      ...circles.map((circle, index) => {
        switch (index) {
          case 0:
            return circle.position(
              circle.position().add(dir(4, -60)),
              2,
              linear
            );
          case 3:
            return circle.position(
              circle.position().add(dir(8, -57)),
              2,
              linear
            );
          case 6:
            return circle.position(
              circle.position().add(dir(14, -49)),
              2,
              linear
            );
          case 9:
            return circle.position(
              circle.position().add(dir(11, -39)),
              2,
              linear
            );
          case 1:
            return circle.position(
              circle.position().add(dir(50, 32)),
              2,
              linear
            );
          case 4:
            return circle.position(
              circle.position().add(dir(45, 36)),
              2,
              linear
            );
          case 7:
            return circle.position(
              circle.position().add(dir(36, 36)),
              2,
              linear
            );
          case 10:
            return circle.position(
              circle.position().add(dir(32, 32)),
              2,
              linear
            );
          case 2:
            return circle.position(
              circle.position().add(dir(-51, 24)),
              2,
              linear
            );
          case 5:
            return circle.position(
              circle.position().add(dir(-51, 20)),
              2,
              linear
            );
          case 8:
            return circle.position(
              circle.position().add(dir(-48, 15)),
              2,
              linear
            );
          case 11:
            return circle.position(
              circle.position().add(dir(-39, 11)),
              2,
              linear
            );
        }
      }),
      page().scale(diagonalScale(129), 2, linear),
      page().position(pageDir(-4.5, diagonalScale(129)), 2, linear),
      delay(1, circles[12].animateOuterDotsFromCenter(0.5, true))
    );

    yield* waitUntil("Inner5");
    if (!debug) {
      yield* circles[12].animateInnerDots();
    }

    yield* waitUntil("Spread5");
    yield* all(
      circles[13].animateOuterDotsFromCenter(0),
      circles[14].animateOuterDotsFromCenter(0)
    );
    if (!debug) {
      yield* all(
        circles[13].animateInnerDots(0),
        circles[14].animateInnerDots(0)
      );
    }

    yield* all(
      circles[12].position(circles[12].position().add(dir(42, -9)), 2, linear),
      circles[13].position(circles[13].position().add(dir(-9, 42)), 2, linear),
      circles[14].position(
        circles[14].position().add(dir(-30, -30)),
        2,
        linear
      ),
      page().scale(diagonalScale(129), 2, linear),
      page().position(pageDir(-4.5, diagonalScale(129)), 2, linear)
    );

    yield* waitUntil("Rays5");
    if (!debug) {
      yield* all(
        circles[12].animateRaysH(2),
        circles[13].animateRaysD(2),
        circles[14].animateRaysM(2)
      );
    }
  }
  //#endregion

  yield* waitFor(5);
});
