
// actual screen size of the grid we draw to
const CANVAS_SIZE = 600;
// dimension of the grid we solve
let DIMENSION = 10;
// whether our wfc solver is done or not
let isDone = false;

function sleep(sleepDuration){
    var now = new Date().getTime();
    while(new Date().getTime() < now + sleepDuration){ /* Do nothing */ }
}

// holds possible variations of each tile (rotations)
let tileVariations = [];
// flat array that holds the actual values of each part of our grid that can be updated/rendered
let grid = [];

const backgroundCol = 0; // single number = greyscale val
const emptyTileCol = 51;
// base pos of our WFC grid on screen
const baseWFCGridPos = [0, 30];
// base pos of WFC dimension slider
const baseWFCDimensionSlider = [140, 0];

// reference to the slider that holds the user's desired grid dimensions
let dimensionSlider;

// number of times we've restarted to solve this grid
let numSolveAttemps = 1;


let railBaseTiles;
let defaultDemoBaseTiles;
let pipesBaseTiles;
let trainTracksBaseTiles;
let mountainsBaseTiles;
let polkaBaseTiles;
let circuitBaseTiles;

let allTileVariations;
let tileVariationSetIndex;

function initializeAllTilesets() {
    // the TileVariation edges are generic, so you can use anything as the identifier here
    // if it's a simple tileset like the demo one, 1's and 0's suffice, but if there's
    // asymmetrical tiles, using more keys like "ABB", "ABA", etc will produce better results
    // Note: EDGES ARRAY GOES                        UP, RIGHT, DOWN, LEFT

    const railBaseImgPath = "tiles/demo_tiles/rail";
    railBaseTiles = [
        // tiles/demo_tiles/rail
        new TileVariation(`${railBaseImgPath}/tile0.png`, ["AAA", "AAA", "AAA", "AAA"]),
        new TileVariation(`${railBaseImgPath}/tile1.png`, ["ABA", "ABA", "ABA", "AAA"]),
        new TileVariation(`${railBaseImgPath}/tile2.png`, ["BAA", "AAB", "AAA", "AAA"]),
        new TileVariation(`${railBaseImgPath}/tile3.png`, ["BAA", "AAA", "BAA", "AAA"]),
        new TileVariation(`${railBaseImgPath}/tile4.png`, ["ABA", "ABA", "AAA", "AAA"]),
        new TileVariation(`${railBaseImgPath}/tile5.png`, ["ABA", "AAA", "ABA", "AAA"]),
        new TileVariation(`${railBaseImgPath}/tile6.png`, ["ABA", "ABA", "ABA", "ABA"]),
    ];

    const defaultDemoBaseImgPath = "tiles/demo_tiles/basic_t"
    defaultDemoBaseTiles = [
        new TileVariation(`${defaultDemoBaseImgPath}/blank.png`, [0, 0, 0, 0]),
        new TileVariation(`${defaultDemoBaseImgPath}/down.png`, [0, 1, 1, 1]),
    ];

    const pipesBaseImgPath = "tiles/demo_tiles/pipes"
    pipesBaseTiles = [
        new TileVariation(`${pipesBaseImgPath}/blank.png`, [0, 0, 0, 0]),
        new TileVariation(`${pipesBaseImgPath}/down.png`, [0, 1, 1, 1]),
    ];

    const trainTracksBaseImgPath = "tiles/demo_tiles/train-tracks"
    trainTracksBaseTiles = [
        new TileVariation(`${trainTracksBaseImgPath}/blank.png`, [0, 0, 0, 0]),
        new TileVariation(`${trainTracksBaseImgPath}/down.png`, [0, 1, 1, 1]),
    ];

    const mountainBaseImgPath = "tiles/demo_tiles/mountains"
    mountainsBaseTiles = [
        new TileVariation(`${mountainBaseImgPath}/blank.png`, [0, 0, 0, 0]),
        new TileVariation(`${mountainBaseImgPath}/down.png`, [0, 1, 1, 1]),
    ];

    const polkaBaseImgPath = "tiles/demo_tiles/polka"
    polkaBaseTiles = [
        new TileVariation(`${polkaBaseImgPath}/blank.png`, [0, 0, 0, 0]),
        new TileVariation(`${polkaBaseImgPath}/down.png`, [0, 1, 1, 1]),
    ];

    const circuitBaseImgPath = "tiles/demo_tiles/circuit";
    circuitBaseTiles = [
        new TileVariation(`${circuitBaseImgPath}/0.png`,  ['AAA', 'AAA', 'AAA', 'AAA']),
        new TileVariation(`${circuitBaseImgPath}/1.png`,  ['BBB', 'BBB', 'BBB', 'BBB']),
        new TileVariation(`${circuitBaseImgPath}/2.png`,  ['BBB', 'BCB', 'BBB', 'BBB']),
        new TileVariation(`${circuitBaseImgPath}/3.png`,  ['BBB', 'BDB', 'BBB', 'BDB']),
        new TileVariation(`${circuitBaseImgPath}/4.png`,  ['ABB', 'BCB', 'BBA', 'AAA']),
        new TileVariation(`${circuitBaseImgPath}/5.png`,  ['ABB', 'BBB', 'BBB', 'BBA']),
        new TileVariation(`${circuitBaseImgPath}/6.png`,  ['BBB', 'BCB', 'BBB', 'BCB']),
        new TileVariation(`${circuitBaseImgPath}/7.png`,  ['BDB', 'BCB', 'BDB', 'BCB']),
        new TileVariation(`${circuitBaseImgPath}/8.png`,  ['BDB', 'BBB', 'BCB', 'BBB']),
        new TileVariation(`${circuitBaseImgPath}/9.png`,  ['BCB', 'BCB', 'BBB', 'BCB']),
        new TileVariation(`${circuitBaseImgPath}/10.png`, ['BCB', 'BCB', 'BCB', 'BCB']),
        new TileVariation(`${circuitBaseImgPath}/11.png`, ['BCB', 'BCB', 'BBB', 'BBB']),
        new TileVariation(`${circuitBaseImgPath}/12.png`, ['BBB', 'BCB', 'BBB', 'BCB']),
    ];


    tileVariationSetIndex = 0;
    allTileVariations = [defaultDemoBaseTiles, railBaseTiles, pipesBaseTiles, circuitBaseTiles, trainTracksBaseTiles, mountainsBaseTiles, polkaBaseTiles];
}

function setup() {
    initializeAllTilesets();
    //randomSeed(99);

    let button = createButton('Click to Regenerate');
    button.position(0, 0);
    button.mousePressed(OnRegenGridClicked);
    dimensionSlider = createSlider(2, 30, 10, 1);
    dimensionSlider.position(baseWFCDimensionSlider[0], baseWFCDimensionSlider[1]);
    DIMENSION = dimensionSlider.value();
    
    let canvas = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    canvas.position(baseWFCGridPos[0], baseWFCGridPos[1]);
    background(backgroundCol);

    initTiles(allTileVariations[tileVariationSetIndex]);
}

function OnRegenGridClicked() {
    numSolveAttemps = 1;
    DIMENSION = dimensionSlider.value();
    resetGrid();
}

// called once-per-frame
function draw() {
    updateWFC();
    render();

    push();
    textSize(15);
    strokeWeight(5);
    stroke(0, 0, 0, 255); // black outline
    fill(255, 255, 255, 255); // white text
    text("Number of attempts to solve: " + numSolveAttemps, 5, 15);
    pop();
}



function initTiles(baseTiles) {
    tileVariationSetIndex = (tileVariationSetIndex+1) % allTileVariations.length;
    // get tile variations with different images/edges
    // in the future this might be something that gets done through
    // user input
    
    // here, we load the base variations of the tiles based on the images we have
    tileVariations = baseTiles;

    // then we also load in the rotated versions of the base images
    const baseVariationsLen = tileVariations.length;
    for (let i = 0; i < baseVariationsLen; i++) {
        // rotate 3 times (original is "pointed up") so we get right, down, and left
        for (let rotation = 0; rotation < 4; rotation++) {
            tileVariations.push( tileVariations[i].rotate(rotation) );
        }
    }

    function removeDuplicatedTiles(tiles) {
        const uniqueTilesMap = {};
        for (const tile of tiles) {
            const key = tile.edges.join(','); // ex: 'ABB,BCB,BBA,AAA'
            const keyInMap = key in uniqueTilesMap;
            // this just ensures that we keep tiles whose imgPath is valid over tiles whose imgPath is blank
            const shouldAdd = !keyInMap || keyInMap && uniqueTilesMap[key].imgPath == "" && tile.imgPath != "";
            if (shouldAdd) uniqueTilesMap[key] = tile;
        }
        return Object.values(uniqueTilesMap);
    }
    tileVariations = removeDuplicatedTiles(tileVariations);

    // Generate the adjacency rules based on edges
    for (let tileVariation of tileVariations) {
        tileVariation.analyze(tileVariations);
    }

    resetGrid();
}

function switchToNextTileset() {
    resetGrid();
    initTiles(allTileVariations[tileVariationSetIndex]);
    numSolveAttemps = 1;
}

function resetGrid() {
    isDone = false;
    // initialize grid with Cell's that only hold their possible options
    // passing in just this length here will initialize the Cell's options field
    // to hold all possible options (max entropy)
    for (let i = 0; i < DIMENSION * DIMENSION; i++) {
        const [xIdx, yIdx] = IdxToGridCoords(i);
        // init with x and y index into 'grid'. We need x and y idx in each cell because there are
        // times when we copy and shuffle around Cells in temporary arrays and we need to reference the original
        // indices of that Cell in those cases
        // Cell's are initialized with ALL possible options (I.E. this Cell could be anything... max entropy)
        grid[i] = new Cell(tileVariations.length, xIdx, yIdx);
    }
}


function render() {
    background(backgroundCol);

    const tileWidth = width / DIMENSION;
    const tileHeight = height / DIMENSION;
    for (let i = 0; i < DIMENSION * DIMENSION; i++) {
        let thisTile = grid[i];
        const [xIdx, yIdx] = IdxToGridCoords(i);
        const x = xIdx * tileWidth;
        const y = yIdx * tileHeight;
        if (thisTile != undefined && thisTile.collapsed) {
            const tileVariationIdx = thisTile.tileVariationIdx;
            const imgToDraw = tileVariations[tileVariationIdx];
            imgToDraw.Draw(x, y, tileWidth, tileHeight);
        }
        else { // non-collapsed, draw blank
            push();
            fill(emptyTileCol);
            rect(x, y, tileWidth, tileHeight);
            pop();
        }
    }
}


function updateWFC() {
    if (isDone) return;
    // ========= find least-entropy cell ==============
    
    // copy grid and get rid of all already-collapsed cells
    let entropySortedGrid = grid.slice().filter(thisCell => !thisCell.collapsed); // copy our grid
    // if there are no un-collapsed cells, we're done!
    if (entropySortedGrid.length == 0) {
        isDone = true;
        console.log("Finished!");
        sleep(1500);
        switchToNextTileset();
        return;
    }
    // sort copied grid by entropy
    entropySortedGrid.sort( 
        (cell1, cell2) => cell1.options.length - cell2.options.length 
    );
    // first cell in this sorted list has lowest entropy
    let lowestEntropy = entropySortedGrid[0].options.length;
    // filter out all cells whose entropy is higher than (not equal) the lowest entropy
    let lowestEntropyFilter = thisCell => thisCell.options.length == lowestEntropy;
    entropySortedGrid = entropySortedGrid.filter(lowestEntropyFilter);
    // at this point, entropySortedGrid contains cells who has the lowest entropy
    // there may be multiple of these, so lets just pick one at random (if there's one, it'll just choose that one)
    if (entropySortedGrid.length > 1) {
        // TODO: if we picked a random tile, save our state for future backtracking
    }
    const cellToCollapseIdx = int(random(entropySortedGrid.length));
    let cellToCollapse = entropySortedGrid[cellToCollapseIdx];

    // collapse this cell and propogate this to neighboring cell's options list
    
    // ===== collapse ===== 
    if (!cellToCollapse.Collapse()) {
        // if we "cant" collapse, either backtrack or start over
        console.log("Found contradiction! Need to backtrack or restart...");
        numSolveAttemps++;
        resetGrid();
        // TODO: backtrack here
        return;
    }


    // ===== propogate ===== 

    let changedCells = [ GridToFlatIdx(cellToCollapse.xIdx, cellToCollapse.yIdx) ];

    let propogateAndRecurse = function (originalCell, destCell, dir) {
        const originalGridIdx = GridToFlatIdx(originalCell.xIdx, originalCell.yIdx);
        if (shouldPropagate(originalCell, destCell, dir)) {
            if (!changedCells.includes(originalGridIdx)) changedCells.push(originalGridIdx);
        }
    }

    while (changedCells.length > 0) {
        let originalCell = grid[changedCells.pop()];
        
        const upIdx    =  GridToFlatIdx(cellToCollapse.xIdx,   cellToCollapse.yIdx-1);
        const downIdx  =  GridToFlatIdx(cellToCollapse.xIdx,   cellToCollapse.yIdx+1);
        const rightIdx =  GridToFlatIdx(cellToCollapse.xIdx+1, cellToCollapse.yIdx);
        const leftIdx  =  GridToFlatIdx(cellToCollapse.xIdx-1, cellToCollapse.yIdx);

        let cellUp     =  grid[upIdx];
        let cellDown   =  grid[downIdx];
        let cellRight  =  grid[rightIdx];
        let cellLeft   =  grid[leftIdx];

        // don't propogate out of bounds
        if (originalCell.yIdx > 0) {
            propogateAndRecurse(originalCell, cellUp, UP);
        }
        if (originalCell.yIdx < DIMENSION - 1) {
            propogateAndRecurse(originalCell, cellDown, DOWN);
        }
        if (originalCell.xIdx < DIMENSION - 1) {
            propogateAndRecurse(originalCell, cellRight, RIGHT);
        }
        if (originalCell.xIdx > 0) {
            propogateAndRecurse(originalCell, cellLeft, LEFT);
        }
    }
    //sleep(1000);
}


// propagate options from src to dest. If dest is above src, dir == UP.
// dest is the cell to the <dir> of the original cell (src)
// returns whether we've changed the dest cell's options
function shouldPropagate(originalCell, destCell, dir) {
    const previousNumOptions = destCell.options.length;
    // possibilities of originalCell on the dir side
    let validOptionsDirOfCell = originalCell.validOptions(tileVariations, dir);
    // removes elements of destCell.options that are not in validOptionsDirOfCell
    destCell.options = filterWithArray(destCell.options, validOptionsDirOfCell);
    const newNumOptions = destCell.options.length;
    return previousNumOptions != newNumOptions; // return whether we changed 'destCell' cell's options
}



// removes elements in arr that are not in valid
function filterWithArray(arr, validElements) {
    return arr.filter(x => validElements.includes(x));
}
// input 2d array indices and get
// 1d array idx
function GridToFlatIdx(i, j) {
    return i + j * DIMENSION;
}
function IdxToGridCoords(i) {
    const xIdx = i % DIMENSION;
    const yIdx = floor(i / DIMENSION);
    return [xIdx, yIdx];
}