
function reverseString(s) {
    return s.split("").reverse().join("");
}

// make edges into strings
// this allows us to have edges be simple numbers, but also
// more complex strings if we want to check edge compatibility
// with more precision
function compatibleEdges(a, b) {
    return str(a) == reverseString(str(b));
}

// indices into edges list
const UP = 0;
const RIGHT = 1;
const DOWN = 2;
const LEFT = 3;

class Cell {
    
    constructor(numOptions, xIdx, yIdx) {
        this.xIdx = xIdx; // x index into our global grid
        this.yIdx = yIdx; // y index into our global grid
        this.options = []; // possible tile options THIS Cell could be
        for (let i = 0; i < numOptions; i++) {
            this.options[i] = i;
        }
        this.collapsed = this.options.length == 1;
        this.tileVariationIdx = -1; // the index into the Tile Variations list to use to render this Cell
    }

    // collapses this Cell, returns false when there are no options for this cell and we've hit a "contradiction"
    Collapse() {
        this.collapsed = true;
        // pick from possible tile variations
        const pickedOptionIdx = int(random(this.options.length));
        const pickedOption = this.options[pickedOptionIdx];
        if (pickedOption === undefined) {
            return false;
        }
        // "picking an option" just means making the options list only contain that one
        this.options = [pickedOption];
        // this tells us what tile variation to use to draw this.
        this.tileVariationIdx = pickedOption;
        return true;
    }


    // returns all valid options for the Cell to the
    // <dir> of this Cell
    validOptions(allTiles, dir) {
        let validOptions = new Set(); // no dupes
        // for every possible variation of THIS tile
        for (let option of this.options) {
            // look at that tile variation and what is 
            // compatible with the specified direction
            let valid = allTiles[option].compatibles(dir);
            for (let opt of valid) {
                validOptions.add(opt);
            }
        }
        return Array.from(validOptions);
    }

}


// holds the image and connection sockets of a possible cell on our grid
class TileVariation {
    
    constructor(imgPath, edges) {
        console.log("Loaded img: " + imgPath);
        this.LoadTileImage(imgPath);
        this.collapsed = false; // whether this tile is collapsed or not

        this.edges = edges; // array that signifies which "edges" this tile can connect to
        // EX: if this is a blank single-color square, all edges might be 0
        // if this is something that looks like a tetris T block facing down, the top edge might be 0
        // while the other 3 sides might be 1. The connection "keys" are arbitrarily generated
        // since they are only ever compared to each other

        this.numRotations = 0;
        this.up = [];
        this.down = [];
        this.right = [];
        this.left = [];
    }

    LoadTileImage(imgPath) {
        this.imgPath = imgPath;
        if (imgPath) this.img = loadImage(imgPath);
        else this.img = undefined;
    }

    Draw(x, y, tileWidth, tileHeight) {
        if (this.numRotations > 0) {
            rotate_and_draw_image(this.img, x, y, tileWidth, tileHeight, 90 * this.numRotations);
        }
        else {
            image(this.img, x, y, tileWidth, tileHeight);
        }
    }
    
    // return new Tile based off this one but rotated 90 degrees * numRotations
    // (I.E. numRotations = 2 means we rotate it 180 degrees)
    rotate(numRotations) {
        const newEdges = [];
        const len = this.edges.length;
        for (let i = 0; i < len; i++) {
            newEdges[i] = this.edges[(i - numRotations + len) % len];
        }
        // TODO: dont regenerate the image here
        let newTile = new TileVariation(this.imgPath, newEdges);
        newTile.numRotations = numRotations;
        return newTile;
    }


    // tiles is an array of all TileVariation's (I.E. including rotated variations)
    // genetates adjacency rules for this tile based on other tile variations
    analyze(tileVariations) {
        for (let i = 0; i < tileVariations.length; i++) {
            let tileVariation = tileVariations[i];

            // UP
            if (compatibleEdges(tileVariation.edges[DOWN], this.edges[UP])) {
                this.up.push(i);
            }
            // RIGHT
            if (compatibleEdges(tileVariation.edges[LEFT], this.edges[RIGHT])) {
                this.right.push(i);
            }
            // DOWN
            if (compatibleEdges(tileVariation.edges[UP], this.edges[DOWN])) {
                this.down.push(i);
            }
            // LEFT
            if (compatibleEdges(tileVariation.edges[RIGHT], this.edges[LEFT])) {
                this.left.push(i);
            }
        }
    }

    compatibles(dir) {
        switch (dir) {
            case UP:
                return this.up;
            case RIGHT:
                return this.right;
            case DOWN:
                return this.down;
            case LEFT:
                return this.left;
        }
    }
    
    
}


function rotate_and_draw_image(img, img_x, img_y, img_width, img_height, img_angle_deg){
    push();
    imageMode(CENTER);
    translate(img_x + img_width / 2, img_y + img_width / 2);
    rotate(PI / 180 * img_angle_deg);
    image(img, 0, 0, img_width, img_height);
    rotate(-PI / 180 * img_angle_deg);
    translate(-(img_x+img_width / 2), -(img_y + img_width / 2));
    imageMode(CORNER);
    pop();
}