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

  const y: number = -500; // Starting y position
  const m: number = 100; // Length Modifier
  const t: number = 1; // Time in seconds
  const tF: TimingFunction = linear;

  const rows: Line[][] = [];
  const pointsList: PossibleVector2<number>[][] = [];
  const positions: PossibleVector2<number>[][] = [];
  positions[0] = [[0, y]];
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
  for (let i = 0; i < 8; i++) {
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

    // Consolidate Adjacent Lines
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
});
