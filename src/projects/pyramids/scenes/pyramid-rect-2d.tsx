import { Layout, Line, Rect, makeScene2D } from "@motion-canvas/2d";
import {
  PossibleVector2,
  all,
  chain,
  createRef,
  loop,
  loopUntil,
  makeRef,
} from "@motion-canvas/core";
import { motionBlack, motionDarkGrey } from "../utils";

export default makeScene2D(function* (view) {
  //#region Constants and References
  const freeRoot = createRef<Rect>();

  const y: number = 0; // Starting y position
  const m: number = 100; // Length Modifier

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
    let lines: Line[] = [];
    let startPositions = positions[i];
    // Create/Add Lines at each position with 4 points at 0
    startPositions.forEach((pos, index) => {
      freeRoot().add(createLine(lines, index, pos, createPoints()));
    });
    // [[0, 0], [0, 0], [0, 0], [0, 0]] -> [[-m, 0], [-m, 0], [m, 0], [m, 0]]
    lines.forEach((line, index) => {
      
    })
    // create next start positions
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
