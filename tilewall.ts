///<reference path="./typings/index.d.ts"/>

import * as $ from "/node_modules/jquery/dist/jquery.js";
import * as _ from "/node_modules/lodash/lodash.js";
import * as Contracts from "tilewall.contracts";

export default class Tilewall {
    // region private variables
    private config = {
        selectorContainer: ".tilewall",
        classTmpContainer: "tmpTilewall",
        stylesTmpContainer: "display: none; height: 0; width: 0; overflow: hidden;",
        elementsPerRow: 4,
        elementKeyHeight: "data-tw-height",
        elementKeyWidth: "data-tw-width",
        elementKeyId: "data-tw-id"
    };
    private matrix: [number][];
    private tilewallData: any = {};
    // endregion

    constructor(config: {}) {
        this.config = _.defaults(config, this.config);

        this.setup();
    }

    private setup() {
        // reduce the elementsPerRow to avoid mistakes based on array start counting from 0
        this.config.elementsPerRow += -1;

        this.createTmpContainer();
        this.matrixNewLine();

        this.mapElements();
        console.log(this.matrix);
    }

    private createTmpContainer() {
        // Create the tmp-container for the elements
        $(this.config.selectorContainer).after("<div class='" + this.config.classTmpContainer + "'></div>");

        // Assign a selector for the new tmp-container to the config
        _.assign(this.config, {"selectorTmpContainer": "." + this.config.classTmpContainer});
    }

    private mapElements(): any {
        let _this = this,
            map = [],
            iteratee: number = 1,
            element: {} = {};

        $(this.config.selectorContainer).children().each(function () {
            element = {
                "id": iteratee,
                "element": $(this),
                "size": {
                    "height": parseInt($(this).attr(_this.config.elementKeyHeight)),
                    "width": parseInt($(this).attr(_this.config.elementKeyWidth))
                }
            };
            map.push(element);
            console.log(element);
            console.log("start searching for element above");
            _this.findFreeSpaceForElementInMatrix(element);
            console.log("-------------------------------------------");
            iteratee += 1;
        });

        this.tilewallData.elements = map;
    }

    private findFreeSpaceForElementInMatrix(element: any) {
        console.log("findFreeSpaceForElementInMatrix");
        let matrix = this.matrix,
            neededWidth = ( (element.size.width) ? element.size.width : 1 ),
            neededHeight = ( (element.size.height) ? element.size.height : 1 ),
            freeSpaceFounded: boolean = false;
        console.log("width: " + neededWidth + ", height: " + neededHeight);

        for (let rows in matrix) {
            for (let slots in matrix[rows]) {
                let row = parseInt(rows),
                    slot = parseInt(slots);

                if (this.isFreeSpaceAtSpecificMatrixRowSlot(row, slot, neededWidth, neededHeight)) {
                    freeSpaceFounded = true;
                    this.matrixSaveElement(row, slot, element.id, neededHeight, neededWidth);

                    break;
                }
            }

            if (freeSpaceFounded) {
                break;
            }
        }

        if (!freeSpaceFounded) {
            this.matrixNewLine();
            this.findFreeSpaceForElementInMatrix(element);
        } else {
            return true;
        }
    }

    // Prüft eine bestimmte Reihe in der Matrix darauf, ob in der vorgegebenen Reihe dem Parameter neededSpace entsprechend Plätze frei sind.
    private isFreeSpaceAtSpecificMatrixRowSlot(row: number, slot: number, neededWidth: number, neededHeight: number) {
        let matrix = this.matrix,
            maxRowWidth = this.config.elementsPerRow;

        if ((maxRowWidth + 1) - slot < neededWidth) {
            return false;
        } else {
            if (_.get(matrix, "[" + row + "][" + slot + "]", 999) !== 0) {
                return false;
            } else {
                if (_.get(matrix, "[" + row + "][" + slot + "]", 999) === 0) {
                    if (neededHeight === 1 && neededWidth === 1) {
                        return true;
                    } else {
                        if (neededHeight > 1 && neededWidth === 1) {
                            return this.isFreeSpaceAtSpecificMatrixRowSlot(row + 1, slot, neededWidth, neededHeight - 1);
                        } else if (neededHeight === 1 && neededWidth > 1) {
                            return this.isFreeSpaceAtSpecificMatrixRowSlot(row, slot + 1, neededWidth - 1, neededHeight);
                        } else {
                            throw new Error("Something went wrong at isFreeSpaceAtSpecificMatrixRowSlot(). Maybe the given parameters were corrupt?");
                        }
                    }
                }
            }
        }
    }

    private matrixNewLine() {
        // initialize the matrix
        if (_.isEmpty(this.matrix)) {
            this.matrix = [];
        }
        this.matrix.push(this.generateDefaultMatrixRowArray());
    }

    private matrixSaveElement(row: number, slot: number, elementId: number, elementHeight: number, elementWidth: number) {
        console.log(row, slot);

        // just to be sure
        if (this.matrix[row][slot] === 0) {
            this.matrix[row][slot] = elementId;
            this.elementSaveMatrixPosition(row, slot, elementId);
        } else {
            throw new Error("The pointed matrix section isn´t empty!");
        }

        if (elementHeight > 1) {
            this.matrixSaveElement(row + 1, slot, elementId, elementHeight - 1, elementWidth);
        }
        if (elementWidth > 1) {
            this.matrixSaveElement(row, slot + 1, elementId, elementHeight, elementWidth - 1);
        }
        console.log(this.matrix);
    }

    private elementSaveMatrixPosition(row: number, slot: number, elementId: number) {
        console.log("elements" + this.tilewallData.elements);
        let mapPosition = _.find(this.tilewallData.elements, {id: elementId});

        if (_.isEmpty(mapPosition)) {
            throw new Error("Element could not be found!");
        } else {
            console.log("map: ");
            console.log(mapPosition);
            mapPosition.position = {
                row: row,
                slot: slot
            }
        }
    }

    private generateDefaultMatrixRowArray(): any {
        let array = [];

        for (let i = 0; i <= this.config.elementsPerRow; i++) {
            array.push(0);
        }
        return array;
    }

    // api to give the data of the wall
    public get TilewallData(): any {
        return this.tilewallData;
    }

    // should not be open for public
    // // api to set the data of the wall
    // public set TilewallData(tilewallData: {}) {
    //      this.tilewallData = _.defaults(tilewallData, this.tilewallData);
    // }
}