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
  const size: number[] = [1, 2, 3, 4, 5];
  const circles: CirclePattern[] = [];

  circles[0] = new CirclePattern(size[0], logger);
  circles[1] = new CirclePattern(size[0], logger);
  circles[2] = new CirclePattern(size[0], logger);
  //#endregion
  // position={pageDir(1, 19.1)}
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
        width={"100%"}
        height={"100%"}
        spacing={unit}
        start={0}
        end={1}
      ></Grid>
    </Layout>
  );

  //#region circles 1
  page().add(circles[0]);
  page().add(circles[1]);
  page().add(circles[2]);

  yield* waitUntil("Outer1");
  yield* circles[0].animateOuterDotsFromCenter(0.4, true);

  yield* waitUntil("Inner1");
  yield* circles[0].animateInnerDots();

  // yield* waitUntil("Spread1");
  // yield* all(
  //   circles[1].animateOuterDotsFromCenter(0),
  //   circles[1].animateInnerDots(0),
  //   circles[2].animateOuterDotsFromCenter(0),
  //   circles[2].animateInnerDots(0)
  // );

  // yield* all(
  //   circles[0].position(circles[0].position().add(dir(0, 3)), 2, linear),
  //   circles[1].position(circles[1].position().add(dir(-1, -1)), 2, linear),
  //   circles[2].position(circles[2].position().add(dir(3, 0)), 2, linear),
  //   page().scale(diagonalScale(6.5), 2, linear),
  //   page().position(pageDir(0.25, diagonalScale(6.5)), 2, linear)
  // );

  // yield* waitUntil("Rays1");
  // yield* all(
  //   circles[0].animateRaysH(2),
  //   circles[1].animateRaysD(2),
  //   circles[2].animateRaysM(2)
  // );
  // //#endregion

  // //#region circles 2
  // circles[3] = new CirclePattern(size[1], logger);
  // circles[4] = new CirclePattern(size[1], logger);
  // circles[5] = new CirclePattern(size[1], logger);

  // page().add(circles[3]);
  // page().add(circles[4]);
  // page().add(circles[5]);

  // yield* waitUntil("Outer2");
  // yield* all(
  //   circles[0].position(circles[0].position().add(dir(-1, 7)), 2, linear),
  //   circles[1].position(circles[1].position().add(dir(-4, -4)), 2, linear),
  //   circles[2].position(circles[2].position().add(dir(7, -1)), 2, linear),
  //   page().scale(diagonalScale(13.5), 2, linear),
  //   page().position(pageDir(0.75, diagonalScale(13.5)), 2, linear),
  //   delay(1, circles[3].animateOuterDotsFromCenter(0.5, true))
  // );

  // yield* waitUntil("Inner2");
  // yield* circles[3].animateInnerDots(0.2);

  // yield* waitUntil("Spread2");
  // yield* all(
  //   circles[4].animateOuterDotsFromCenter(0),
  //   circles[4].animateInnerDots(0),
  //   circles[5].animateOuterDotsFromCenter(0),
  //   circles[5].animateInnerDots(0)
  // );

  // yield* all(
  //   circles[3].position(circles[3].position().add(dir(-6, 3)), 2, linear),
  //   circles[4].position(circles[4].position().add(dir(3, -6)), 2, linear),
  //   circles[5].position(circles[5].position().add(dir(6, 6)), 2, linear),
  //   page().scale(diagonalScale(18.5), 2, linear),
  //   page().position(pageDir(-1.75, diagonalScale(18.5)), 2, linear)
  // );

  // yield* waitUntil("Rays2");
  // yield* all(
  //   circles[3].animateRaysH(2),
  //   circles[4].animateRaysD(2),
  //   circles[5].animateRaysM(2)
  // );
  // //#endregion

  // //#region circles 3
  // circles[6] = new CirclePattern(size[2], logger);
  // circles[7] = new CirclePattern(size[2], logger);
  // circles[8] = new CirclePattern(size[2], logger);

  // page().add(circles[6]);
  // page().add(circles[7]);
  // page().add(circles[8]);

  // yield* waitUntil("Outer3");
  // yield* all(
  //   ...circles.map((circle, index) => {
  //     if (index > 5) return;
  //     switch (index) {
  //       case 0:
  //         return circle.position(circle.position().add(dir(-19, 4)), 2, linear);
  //       case 3:
  //         return circle.position(circle.position().add(dir(-15, 2)), 2, linear);
  //       case 1:
  //         return circle.position(circle.position().add(dir(3, -18)), 2, linear);
  //       case 4:
  //         return circle.position(circle.position().add(dir(2, -15)), 2, linear);
  //       case 2:
  //         return circle.position(circle.position().add(dir(11, 11)), 2, linear);
  //       case 5:
  //         return circle.position(circle.position().add(dir(10, 10)), 2, linear);
  //     }
  //   }),
  //   page().scale(diagonalScale(36), 2, linear),
  //   page().position(pageDir(-3, diagonalScale(36)), 2, linear),
  //   delay(1, circles[6].animateOuterDotsFromCenter(0.5, true))
  // );

  // yield* waitUntil("Inner3");
  // yield* circles[6].animateInnerDots(0.1);

  // yield* waitUntil("Spread3");
  // yield* all(
  //   circles[7].animateOuterDotsFromCenter(0),
  //   circles[7].animateInnerDots(0),
  //   circles[8].animateOuterDotsFromCenter(0),
  //   circles[8].animateInnerDots(0)
  // );

  // yield* all(
  //   circles[6].position(circles[6].position().add(dir(-11, -11)), 2, linear),
  //   circles[7].position(circles[7].position().add(dir(15, -4)), 2, linear),
  //   circles[8].position(circles[8].position().add(dir(-4, 15)), 2, linear),
  //   page().scale(diagonalScale(42.5), 2, linear),
  //   page().position(pageDir(0.25, diagonalScale(42.5)), 2, linear)
  // );

  // yield* waitUntil("Rays3");
  // yield* all(
  //   circles[6].animateRaysH(2),
  //   circles[7].animateRaysD(2),
  //   circles[8].animateRaysM(2)
  // );
  // //#endregion

  //#region circles 4
  //#endregion

  yield* waitFor(4);
});
