///<reference path="./typings/index.d.ts"/>
import * as $ from "jquery";
import * as _ from "lodash";
import * as Contracts from "tilewall.contracts";

export default class Tilewall {
    // region private variables
    private data: any = {
        matrix: [],
        elements: {},
        dimensions: {
            rows: {}
        },
        config: {
            selectorContainer: ".tilewall",
            selectorElements: "article",
            elementsPerRow: 4,
            elementKeyHeight: "data-tw-height",
            elementKeyWidth: "data-tw-width",
            elementKeyId: "data-tw-id",
            elementKeyPositionRow: "data-tw-pos-row",
            elementKeyPositionSlot: "data-tw-pos-slot",
            heedElementDimensions: true,
            responsive: [
                {
                    width: 1024,
                    elementsPerRow: 3
                },
                {
                    width: 768,
                    elementsPerRow: 2
                },
                {
                    width: 480,
                    elementsPerRow: 1
                }
            ]
        }
    };
    // endregion

    // region constructor
    constructor(config: {}) {
        this.data.config = _.defaultsDeep(config, this.data.config);

        this.setDimensionsData();
        this.render();
        this.events();
    }

    // endregion

    // region private methods
    private render() {
        this.hideContainer();
        this.prependForResponsiveness();

        this.matrixNewLine();

        this.readInitialElements();
        this.renderMatrixToDOM();

        console.log(this.data.matrix);
        console.log(this.data);

        // this.eventTriggerInitialized();
    }

    private events() {
        window.addEventListener('resize', _.debounce(() => {
            this.data.matrix = null;
            // this.render();
        }, 500));
    }

    // Method to set all required measurements
    private setDimensionsData() {
        this.data.dimensions["container"] = {
            width: $(this.data.config.selectorContainer).width(),
        };
        this.data.dimensions["browser"] = {
            height: window.innerHeight || document.body.clientHeight,
            width: window.innerWidth || document.body.clientWidth
        };
        this.data.dimensions["elementsPerRow"] = this.getElementsPerRow();
        // reduce the elementsPerRowArrays to avoid mistakes based on arrays start counting from 0
        this.data.dimensions["elementsPerRowArray"] = this.data.dimensions.elementsPerRow - 1;
        this.data.dimensions["element"] = {
            unit: this.data.dimensions.container.width / this.data.dimensions.elementsPerRow,
        };
    }

    private getElementsPerRow(): number {
        let elementsPerRow: number = this.data.config.elementsPerRow,
            tilewallWidth: number = this.data.dimensions.container.width;
        _.sortBy(this.data.config.responsive, "width");

        _.forEach(this.data.config.responsive, function (dimension) {
            if (dimension.width >= tilewallWidth) {
                elementsPerRow = dimension.elementsPerRow;
            }
        });

        return elementsPerRow;
    }

    private prependForResponsiveness() {
        let _this = this,
            maxAllowedWidth = this.data.dimensions.elementsPerRow;

        $(this.data.config.selectorContainer).children().each(function () {
            if ($(this).attr(_this.data.config.elementKeyWidth) > maxAllowedWidth) {
                if ($(this).attr(_this.data.config.elementKeyWidth) === 2 && maxAllowedWidth === 1) {
                    _this.shrinkElement($(this));
                } else if ($(this).attr(_this.data.config.elementKeyWidth) === 3 && maxAllowedWidth === 2) {
                    _this.shrinkElement($(this));
                } else {
                    $(this).attr(_this.data.config.elementKeyWidth, maxAllowedWidth);
                }
            }
        });
    }

    // ToDo: Set type of $element to jQuery
    private shrinkElement($element: any) {
        $element.attr(this.data.config.elementKeyWidth, 1);
        $element.attr(this.data.config.elementKeyHeight, 2);
    }

    // Loop over all elements in the tilewall-Container
    // gives also an ID to them
    private readInitialElements(): any {
        let _this = this,
            iteratee: number = 1;

        $(this.data.config.selectorContainer).children(this.data.config.selectorElements).each(function () {
            let element = _this.createElementData(iteratee, $(this));

            // save Element to data.elements
            _this.data.elements[iteratee] = element;

            _this.saveElementIdToElementNode($(this), iteratee);
            _this.findFreeSpaceForElementInMatrix(element);
            iteratee += 1;
        });
    }

    private createElementData(id: number, $element: any, height?: number, width?: number, isDetail?: boolean): {} {
        let horizontalBalance = (this.data.config.heedElementDimensions) ? this.getBoxSizingFactors($element, false) : 0,
            verticalBalance = (this.data.config.heedElementDimensions) ? this.getBoxSizingFactors($element, false) : 0;
        height = height || parseInt($element.attr(this.data.config.elementKeyHeight));
        width = width || parseInt($element.attr(this.data.config.elementKeyWidth));
        isDetail = isDetail || false;
        return {
            "id": id,
            "element": $element,
            "parent": $element.parent(),
            "isDetail": isDetail,
            "size": {
                "height": height,
                "width": width
            },
            "dimension": {
                width: width * this.data.dimensions.element.unit - horizontalBalance,
                height: (isDetail) ? this.getCustomElementMeasurements($element, width) : height * this.data.dimensions.element.unit - verticalBalance,
            }
        };
    }

    private getCustomElementMeasurements($element: any, width: number, elementId?: number) {
        $element = $element || _.get(this.data.elements, [elementId, "element"]);

        if (!$element.length) {
            throw new Error("Element could not be found! There is no element with this id!");
        } else {
            $element.css({
                width: (width * this.data.dimensions.element.unit)
            });
            return $element.outerHeight() + this.getBoxSizingFactors($element, true);
        }
    }

    private getBoxSizingFactors($element: any, vertical: boolean) {
        let elementId = $element.attr(this.data.config.elementKeyId),
            elemDims = {
                height: _.get(this.data.elements, [elementId, "dimension", "height"]),
                width: _.get(this.data.elements, [elementId, "dimension", "width"]),
                margin: {
                    top: parseInt($element.css("margin-top")),
                    right: parseInt($element.css("margin-right")),
                    bottom: parseInt($element.css("margin-bottom")),
                    left: parseInt($element.css("margin-left"))
                },
                padding: {
                    top: parseInt($element.css("padding-top")),
                    right: parseInt($element.css("padding-right")),
                    bottom: parseInt($element.css("padding-bottom")),
                    left: parseInt($element.css("padding-left"))
                },
            },
            horizontalBalance = elemDims.margin.left + elemDims.margin.right + elemDims.padding.left + elemDims.padding.right,
            verticalBalance = elemDims.margin.top + elemDims.margin.bottom + elemDims.padding.top + elemDims.padding.bottom;

        if (vertical === false) {
            return verticalBalance;
        } else {
            return horizontalBalance;
        }
    }

    private findFreeSpaceForElementInMatrix(element: any) {
        let matrix = this.data.matrix,
            neededWidth = ( (element.size.width) ? element.size.width : 1 ),
            neededHeight = ( (element.size.height) ? element.size.height : 1 ),
            freeSpaceFounded: boolean = false;

        for (let rows in matrix) {
            for (let slots in matrix[rows]) {
                let row = parseInt(rows),
                    slot = parseInt(slots);

                if (this.isFreeSpaceAtSpecificMatrixRowSlot(row, slot, neededWidth, neededHeight)) {
                    freeSpaceFounded = true;
                    this.saveElementPosition(element.id, row, slot, neededHeight, neededWidth);
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

    // Prüft eine bestimmte Reihe in der Matrix darauf,
    // ob in der vorgegebenen Reihe dem Parameter neededSpace entsprechend Plätze frei sind.
    private isFreeSpaceAtSpecificMatrixRowSlot(row: number, slot: number, neededWidth: number, neededHeight: number) {
        let matrix = this.data.matrix,
            maxRowWidth = this.data.dimensions.elementsPerRow;

        if ((maxRowWidth) - slot < neededWidth) {
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
                            throw new Error("Something went wrong at isFreeSpaceAtSpecificMatrixRowSlot(). " +
                                "Maybe the given parameters were corrupt?");
                        }
                    }
                }
            }
        }
    }

    private matrixNewLine(atRow?: number) {
        atRow = atRow || 0;

        // initialize the matrix
        if (_.isEmpty(this.data.matrix)) {
            this.data.matrix = [];
        }

        if (atRow === 0) {
            return this.data.matrix.push(this.generateDefaultMatrixRowArray());
        } else {
            return this.data.matrix.splice(atRow, 0, this.generateDefaultMatrixRowArray());
        }
    }

    private generateDefaultMatrixRowArray(): any {
        let array = [];

        for (let i = 0; i <= this.data.dimensions.elementsPerRowArray; i++) {
            array.push(0);
        }
        return array;
    }

    private saveElementToMatrix(row: number, slot: number, elementId: number, elementHeight: number, elementWidth: number) {
        // just to be sure
        if (this.data.matrix[row][slot] === 0) {
            this.data.matrix[row][slot] = elementId;
        } else {
            throw new Error("The pointed matrix section isn´t empty!");
        }

        if (elementHeight > 1) {
            this.saveElementToMatrix(row + 1, slot, elementId, elementHeight - 1, elementWidth);
        }
        if (elementWidth > 1) {
            this.saveElementToMatrix(row, slot + 1, elementId, elementHeight, elementWidth - 1);
        }
    }

    private saveElementPositionToElementData(row: number, slot: number, elementId: number) {
        if (_.isEmpty(this.data.elements[elementId])) {
            throw new Error("Element could not be found!");
        } else {
            this.data.elements[elementId]["position"] = {
                row: row,
                slot: slot
            };
        }
    }

    // toDo: change $element: any to $element: jQuery
    private saveElementIdToElementNode($element: any, id: number) {
        $element.attr(this.data.config.elementKeyId, id);
        $element.addClass("tw-" + id);
    }

    private saveElementPosition(elementID: number, row: number, slot: number, height: number, width: number) {
        this.saveElementPositionToElementData(row, slot, elementID);
        this.saveElementToMatrix(row, slot, elementID, height, width);
        // this.saveElementPositionToElementNode(elementID, row, slot);
    }

    private renderMatrixToDOM() {
        let $container = $(this.data.config.selectorContainer);

        for (let element in this.data.elements) {
            let elementSelector = ".tw-" + element;

            this.assignStylesToElements($container.find(elementSelector));
            this.assignPositionToElements($container.find(elementSelector));
        }

        this.showContainer();
    }

    private showContainer() {
        let $container = $(this.data.config.selectorContainer);

        $container.css({
            opacity: 1
        });
    }

    private hideContainer() {
        let $container = $(this.data.config.selectorContainer);

        $container.css({
            opacity: 0
        });
    }

    // ToDo: change type from $element to jQuery
    private assignStylesToElements($element: any) {
        let elementId = $element.attr(this.data.config.elementKeyId),
            height = _.get(this.data.elements, [elementId, "dimension", "height"]),
            width = _.get(this.data.elements, [elementId, "dimension", "width"]);

        $element.css({
            width: width,
            height: height
        });
    }

    private hasRowDetailElement(row: number): number {
        let detailElementId: number = 0;

        for (let element of this.data.matrix[row]) {
            if (element && _.get(this.data.elements, [element, "isDetail"])) {
                detailElementId = _.get(this.data.elements, [element, "id"]);
            }
        }

        return detailElementId;
    }

    private setRowDimensionDataToData(row: number) {
        let preRowPositionBottom = parseInt(this.getRowDimensionDataFromData(row - 1).positionBottom),
            height: number,
            detailElementId = this.hasRowDetailElement(row);

        if (detailElementId !== 0) {
            height = parseInt(this.data.elements[detailElementId].dimension.height);
        } else {
            height = this.data.dimensions.container.width / this.data.dimensions.elementsPerRow;
        }

        this.data.dimensions["rows"][row] = {
            height: height,
            positionTop: preRowPositionBottom,
            positionBottom: preRowPositionBottom + height
        }
    }

    private getRowDimensionDataFromData(row: number) {
        if (row < 0 || row === undefined) {
            return {positionBottom: 0}
        }

        if (_.isEmpty(_.get(this.data.dimensions.rows, [row]))) {
            this.setRowDimensionDataToData(row);
        }

        return this.data.dimensions.rows[row];
    }

    // ToDo: change type from $element to jQuery
    private assignPositionToElements($element: any, id?: number) {
        let elementId = id || $element.attr(this.data.config.elementKeyId),
            elementRow = _.get(this.data.elements, [elementId, "position", "row"]),
            containerWidth = this.data.dimensions.container.width,
            unit = containerWidth / (this.data.dimensions.elementsPerRow),
            left = _.get(this.data.elements, [elementId, "position", "slot"]) * unit;

        let top = this.getRowDimensionDataFromData(elementRow).positionTop;

        $element.css({
            transform: "translate3d(" + left + "px, " + top + "px, 0px)"
        });
    }

    private refreshStylesOfElements() {
        for (let row of this.data.matrix) {
            for (let element of row) {
                let $container = $(this.data.config.selectorContainer),
                    elementSelector = ".tw-" + element;

                this.assignStylesToElements($container.find(elementSelector));
                this.assignPositionToElements($container.find(elementSelector), element);
            }
        }
    }

    private shiftElementsFromRowToStepRow(row: number, step: number) {
        for (let element in this.data.elements) {
            if (this.data.elements[element].position.row >= row) {
                this.data.elements[element].position.row += step;
            }
        }
    }

    // endregion


    // region public methods
    public onInitialized(callback: () => void) {
        if (this.data.elements) {
            callback();
        } else {
            this.onInitialized(callback);
        }
    }

    // ToDo: change type of $element to jQuery
    public insertCustomElementToSpecificMatrixPosition(row: number, $element: any) {
        let id = 999,
            height = 1,
            width = this.data.dimensions.elementsPerRow;

        if (this.matrixNewLine(row)) {
            this.shiftElementsFromRowToStepRow(row, height);
            this.data.elements[id] = this.createElementData(id, $element, height, width, true);
            this.saveElementPositionToElementData(row, 0, id);
            this.saveElementToMatrix(row, 0, id, height, width);
            $element.attr(this.data.config.elementKeyId, id);
            this.assignStylesToElements($element);
            this.assignPositionToElements($element, id);
            $element.detach().appendTo($(this.data.config.selectorContainer));
            this.data.dimensions.rows = {};
            this.refreshStylesOfElements();
            console.log(this.data);
        }
    }

    public getElementData(id: number) {
        return this.data.elements[id];
    }

    // endregion
}