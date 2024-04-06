import { Grid, Layout, makeScene2D } from "@motion-canvas/2d";
import { all, createRef, linear, useLogger, waitUntil } from "@motion-canvas/core";
import { CirclePattern } from "../utils/CirclePattern";

export default makeScene2D(function* (view) {
  //#region variables
  const logger = useLogger();
  // Values
  const unit = 10;
  // References
  const page = createRef<Layout>();
  const grid = createRef<Grid>();
  // Class
  const firstSize = 3;
  const circle1 = new CirclePattern(firstSize, logger);
  const circle2 = new CirclePattern(firstSize, logger);
  const circle3 = new CirclePattern(firstSize, logger);

  //#endregion

  view.add(
    <Layout ref={page} scale={3} rotation={45}>
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
  page().add(circle1);

  yield* circle1.animateOuterDotsFromCenter(.5, true);

  yield* waitUntil("InnerDots")

  yield* circle1.animateInnerDots();

  page().add(circle2);
  page().add(circle3);

  yield* circle2.animateOuterDotsFromCenter(0);
  yield* circle2.animateInnerDots(0);

  yield* circle3.animateOuterDotsFromCenter(0);
  yield* circle3.animateInnerDots(0);

  yield* waitUntil("SpreadOut")

  yield* all(
    circle1.position(circle1.position().add([0, 3 * unit]), 2, linear),
    circle2.position(circle2.position().add([-1 * unit, -1 * unit]), 2, linear),
    circle3.position(circle3.position().add([3 * unit, 0]), 2, linear)
  );

  yield* waitUntil("Wait")
});
