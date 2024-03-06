import { Layout, Line, Rect, makeScene2D } from "@motion-canvas/2d";
import {
  Logger,
  PossibleVector2,
  TimingFunction,
  all,
  chain,
  createRef,
  isType,
  linear,
  loop,
  loopUntil,
  makeRef,
  useLogger,
} from "@motion-canvas/core";
import { motionBlack, motionDarkGrey } from "../utils";

export default makeScene2D(function* (view) {
  const logger = useLogger();
  //#region Constants and References
  const freeRoot = createRef<Rect>();

  const y: number = 0; // Starting y position
  const m: number = 100; // Length Modifier
  const t: number = 1; // Time in seconds
  const tF: TimingFunction = linear;

  const rows: Line[][] = [];
  const pointsList: PossibleVector2<number>[][] = [];
  const positions: PossibleVector2<number>[][] = [];
  positions[0] = [[0, 0]];
  //#endregion

  //#region Create Functions
  function createLine(
    lines: Line[],
    index: number,
    position: PossibleVector2<number>,
    points: PossibleVector2<number>[]
  ) {
    return (
      <Line
        ref={makeRef(lines, index)}
        position={position}
        points={points}
        stroke={"blue"}
        lineCap={"round"}
        lineWidth={20}
        radius={0.1}
      />
    );
  }

  function createPoints(): PossibleVector2<number>[] {
    return [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ];
  }
  //#endregion

  //#region Add initial Layout
  view.add(<Layout ref={freeRoot}></Layout>);
  //#endregion

  //#region Loop
  for (let i = 0; i < 1; i++) {
    const lines: Line[] = [];
    const startPositions = positions[i];
    // Create/Add Lines at each position with 4 points at 0
    startPositions.forEach((pos, index) => {
      freeRoot().add(createLine(lines, index, pos, createPoints()));
    });
    // [[0, 0], [0, 0], [0, 0], [0, 0]] -> [[-m, 0], [-m, 0], [m, 0], [m, 0]]
    yield* all(
      ...lines.map((line) =>
        line.points(
          [
            [-m, 0],
            [-m, 0],
            [m, 0],
            [m, 0],
          ],
          t,
          tF
        )
      )
    );
    // Consolidate connecting lines
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i];
      const nextLine = lines[i + 1];
      if (line.points()[-1] == nextLine.points()[0]) {
        nextLine.points([
          line.points()[0],
          line.points()[1],
          nextLine.points()[2],
          nextLine.points()[3],
        ]);
        line.remove();
      }
      logger.info(line.parent().toString());
    }
    // filter out lines without parents because they've been removed
    // lines.filter((line, index, arr) => )

    // [[-m, 0], [-m, 0], [m, 0], [m, 0]] -> [[-m, m], [-m, 0], [m, 0], [m, m]]
    yield* all(
      ...lines.map((line) =>
        line.points(
          [
            [-m, m],
            [-m, 0],
            [m, 0],
            [m, m],
          ],
          t,
          tF
        )
      )
    );
    // create next start positions
    positions[i + 1] = [];
    lines.forEach((line, index, arr) => {
      const posX = line.position.x()
      const posY = line.position.y()
      positions[i + 1].push([
        posX + line.parsedPoints()[0].x,
        posY + line.parsedPoints()[0].y,
      ]);
      positions[i + 1].push([
        posX + line.parsedPoints()[3].x,
        posY + line.parsedPoints()[3].y,
      ]);
    });
  }
  //#endregion
  // points position relative to parent.position
  // Line 0
  // Points 0
  // [[0, 0]]
  // Transition Points 0
  // [[0, 0], [0, 0]]
  // Points 1
  // [[-m, 0], [m, 0]]
  // Transition Points 1
  // [[-m, 0], [-m, 0], [m, 0], [m, 0]]
  // Points 2
  // [[-m, m], [-m, 0], [m, 0], [m, m]]

  // Without transitions
  // Line 0
  // Points 0
  // [[0, 0], [0, 0], [0, 0], [0, 0]]
  // Points 1
  // [[-m, 0], [-m, 0], [m, 0], [m, 0]]
  // Check lines for matching ends, consolidate
  // Points 2
  // [[-m, m], [-m, 0], [m, 0], [m, m]]

  // test
  // const testLine = createRef<Line>();
  // view.add(
  //   <Line
  //     ref={testLine}
  //     position={[0, 0]}
  //     points={[
  //       [-100, 0],
  //       [-100, 0],
  //       [100, 0],
  //       [100, 0],
  //     ]}
  //     stroke={"blue"}
  //     lineWidth={20}
  //     lineCap={"round"}
  //     radius={0.1}
  //   />
  // );
  // yield* testLine().points(
  //   [
  //     [-100, 100],
  //     [-100, 0],
  //     [100, 0],
  //     [100, 100],
  //   ],
  //   2
  // );
});
