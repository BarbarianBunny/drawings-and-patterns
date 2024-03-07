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
  waitFor,
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
  for (let i = 0; i < 2; i++) {
    let lines: Line[] = [];
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
    // compare line positions, if they're m apart then they're next to eachother
    // group adjacent lines by position.
    // for each group sum x positions and average by group.length
    // create a new line to replace them using the average x and exact y,
    // taking 2 points from the front of the first line and 2 off the last of the group lines

    // if (line.parent != null && line.x() + m == nextLine.x()) {}
    // if (i == 1) {
    //   logger.info("parsedPoints")
    //   logger.info(lines[0].parsedPoints().toString())
    //   lines[0].x(lines[0].x() + m)
    //   lines[0].points([
    //           lines[0].parsedPoints()[0].addX(-m),
    //           lines[0].parsedPoints()[1].addX(-m),
    //           lines[1].parsedPoints()[2].addX(m),
    //           lines[1].parsedPoints()[3].addX(m),
    //         ])
    //   logger.info(lines[0].parsedPoints().toString())
    //   logger.info("Parent")
    //   logger.info((null != lines[1].parent()).toString())
    //   lines[1].remove()
    //   logger.info((null == lines[1].parent()).toString())
    // }
    // const newPoints = [];
    // const numLines = 0;
    // const xPositions = [];
    // const yPosition = 0;
    for (let j = 0; j < lines.length - 1; j++) {
      const line = lines[j];
      const lineRx = line.x() + line.parsedPoints()[3].x;
      const nextLine = lines[j + 1];
      const nextLineLx = nextLine.x() + nextLine.parsedPoints()[0].x;

      const notRemoved = line.parent() != null;
      const pointsTouch = lineRx == nextLineLx;

      if (notRemoved && pointsTouch) {
        const lineLx = line.x() + line.parsedPoints()[0].x;
        const nextLineRx = nextLine.x() + nextLine.parsedPoints()[3].x;
        const centerX = (lineLx + nextLineRx) / 2;
        const widthX = nextLineRx - lineLx;

        nextLine.x(centerX);
        nextLine.points([
          [-widthX / 2, 0],
          [-widthX / 2, 0],
          [widthX / 2, 0],
          [widthX / 2, 0],
        ]);
        line.remove();
      }
    }
    lines = lines.filter((line) => line.parent() != null);

    // [[-m, 0], [-m, 0], [m, 0], [m, 0]] -> [[-m, m], [-m, 0], [m, 0], [m, m]]
    yield* all(
      ...lines.map((line) =>
        line.points(
          [
            line.parsedPoints()[0].addY(m),
            line.parsedPoints()[1],
            line.parsedPoints()[2],
            line.parsedPoints()[3].addY(m),
          ],
          t,
          tF
        )
      )
    );
    // create next start positions
    positions[i + 1] = [];
    lines.forEach((line, index, arr) => {
      const posX = line.position.x();
      const posY = line.position.y();
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
