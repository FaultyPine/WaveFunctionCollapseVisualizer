
// actual screen size of the grid we draw to
const CANVAS_SIZE = 600;
// dimension of the grid we solve
let DIMENSION = 15;
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

function setup() {
    //randomSeed(99);

    let button = createButton('Click to Regenerate');
    button.position(0, 0);
    button.mousePressed(OnRegenGridClicked);
    dimensionSlider = createSlider(2, 30, 15, 1);
    dimensionSlider.position(baseWFCDimensionSlider[0], baseWFCDimensionSlider[1]);
    DIMENSION = dimensionSlider.value();
    
    let canvas = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    canvas.position(baseWFCGridPos[0], baseWFCGridPos[1]);
    background(backgroundCol);

    initTiles();

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
    fill(255, 255, 255, 255);
    text("Number of attempts to solve: " + numSolveAttemps, 0, 10);
    pop();
}

function InitBaseTileVariations() {
    const baseImgPath = "tiles/demo";
    tileVariations = [
        //                                          UP, RIGHT, DOWN, LEFT
        new TileVariation(`${baseImgPath}/blank.png`, [0, 0, 0, 0]),
        new TileVariation(`${baseImgPath}/down.png`, [0, 1, 1, 1]),
    ];
}

function initTiles() {
    // get tile variations with different images/edges
    // in the future this might be something that gets done through
    // user input

    // here, we load the base variations of the tiles based on the images we have
    InitBaseTileVariations();

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
            const shouldAdd = !keyInMap || keyInMap && uniqueTilesMap[key].imgPath == "" && tile.imgPath != "";
            if (shouldAdd) uniqueTilesMap[key] = tile;
        }
        return Object.values(uniqueTilesMap);
    }
    tileVariations = removeDuplicatedTiles(tileVariations);

    // Generate the adjacency rules based on edges
    for (let i = 0; i < tileVariations.length; i++) {
        const tileVariation = tileVariations[i];
        tileVariation.analyze(tileVariations);
    }

    resetGrid();
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
        // Cell's are initialized with ALL possible options (I.E. this Cell could be anything)
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
    const cellToCollapseIdx = int(random(entropySortedGrid.length));
    let cellToCollapse = entropySortedGrid[cellToCollapseIdx];

    // collapse this cell and propogate this to neighboring cell's options list
    
    // ===== collapse ===== 
    if (!cellToCollapse.Collapse()) {
        // if we "cant" collapse, either backtrack or start over
        // TODO: is this right?
        console.log("Found contradiction! Need to backtrack or restart...");
        numSolveAttemps++;
        resetGrid();
        return;
    }

    //console.log("Cell (" + cellToCollapse.xIdx + ", " + cellToCollapse.yIdx + ") collapsed. Using tile idx = " + cellToCollapse.tileVariationIdx);

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