///<reference path="./typings/index.d.ts"/>

import * as $ from "/node_modules/jquery/dist/jquery.js";
import * as _ from "/node_modules/lodash/lodash.js";
import * as Contracts from "tilewall.contracts";

export default class Tilewall {
    // region private variables
    private data: any = {
        matrix: [],
        elements: {},
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
        this.data.config = _.defaults(config, this.data.config);
        console.log(this.data.config);
        this.render();
        this.events();
    }

    // endregion

    // region private methods
    private render() {
        this.hideContainer();
        this.setData();
        this.prependForResponsiveness();

        this.matrixNewLine();

        this.mapElements();
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

    private mapElements(): any {
        let _this = this,
            iteratee: number = 1;

        $(this.data.config.selectorContainer).children(this.data.config.selectorElements).each(function () {
            let element = _this.createElementData(iteratee, $(this));

            _this.saveElementIdToElementNode($(this), iteratee);
            _this.data.elements[iteratee] = element;
            _this.findFreeSpaceForElementInMatrix(element);
            iteratee += 1;
        });
    }

    private createElementData(id: number, $element: any, height?: number, width?: number, isDetail?: boolean): {} {
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
            }
        };

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

    private matrixNewLine() {
        // initialize the matrix
        if (_.isEmpty(this.data.matrix)) {
            this.data.matrix = [];
        }
        this.data.matrix.push(this.generateDefaultMatrixRowArray());
    }

    private matrixNewLineAtSpecificRow(row: number) {
        // initialize the matrix
        if (_.isEmpty(this.data.matrix)) {
            return false;
        }

        return this.data.matrix.splice(row, 0, this.generateDefaultMatrixRowArray());
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
        let element = this.data.elements[elementId];

        if (_.isEmpty(element)) {
            throw new Error("Element could not be found!");
        } else {
            element["position"] = {
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

    // private saveElementPositionToElementNode(elementID: number, row: number, slot: number) {
    //     let $element = $(this.data.config.selectorContainer).children(".tw-" + elementID);
    //
    //     $element.attr(this.data.config.elementKeyPositionRow, row);
    //     $element.attr(this.data.config.elementKeyPositionSlot, slot);
    // }

    private saveElementPosition(elementID: number, row: number, slot: number, height: number, width: number) {
        this.saveElementPositionToElementData(row, slot, elementID);
        this.saveElementToMatrix(row, slot, elementID, height, width);
        // this.saveElementPositionToElementNode(elementID, row, slot);
    }

    private renderMatrixToDOM() {

        for (let element in this.data.elements) {
            let $container = $(this.data.config.selectorContainer),
                elementSelector = ".tw-" + element;

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
        })
    }

    // ToDo: change type from $element to jQuery
    private assignStylesToElements($element: any, isDetail?: boolean, customheight?: number) {
        let elementId = $element.attr(this.data.config.elementKeyId),
            elementUnit = this.data.dimensions.width,
            unit = elementUnit / (this.data.dimensions.elementsPerRow),
            elemDims = {
                height: _.get(this.data.elements, [elementId, "size", "height"]),
                width: _.get(this.data.elements, [elementId, "size", "width"]),
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

        if (!this.data.config.heedElementDimensions) {
            horizontalBalance = 0;
            verticalBalance = 0;
        }

        isDetail = isDetail || false;
        customheight = (isDetail) ? customheight : ((unit * elemDims.height) - verticalBalance);

        $element.css({
            width: (unit * elemDims.width) - horizontalBalance,
            height: customheight
        });
    }

    // ToDo: change type from $element to jQuery
    private assignPositionToElements($element: any, id?: number) {
        let elementId = id || $element.attr(this.data.config.elementKeyId),
            elementUnit = this.data.dimensions.width,
            row = _.get(this.data.elements, [elementId, "position", "row"]),
            unit = elementUnit / (this.data.dimensions.elementsPerRow),
            left = _.get(this.data.elements, [elementId, "position", "slot"]) * unit,
            top = row * unit;

        $element.css({
            transform: "translate3d(" + left + "px, " + top + "px, 0px)"
        });
    }

    // private getRowTopPosition(row: number) {
    //     let top: number = 0;
    //     let elementUnit = this.data.dimensions.width,
    //         unit = elementUnit / (this.data.dimensions.elementsPerRow);
    //
    //     do {
    //         console.log(row);
    //         let element = this.isRowContainingDetail(row);
    //
    //         if (element) {
    //             top+= element.height;
    //         } else {
    //             top += unit;
    //         }
    //
    //         row--;
    //     } while (row >= 0);
    //     this.isRowContainingDetail(row);
    // }
    //
    // private isRowContainingDetail(row: number): any {
    //     let isRowContainingDetail = 0;
    //     for (let elementId of this.data.matrix[row]) {
    //         let element = _.get(this.data.elements, [elementId]);
    //         if (element.isDetail) {
    //             isRowContainingDetail = element.element;
    //         }
    //     }
    //
    //     return isRowContainingDetail;
    // }

    private setRowDimensionsToData() {
        for (let row in this.data.matrix) {
            this.data["dimensions"]["rows"][row] = {
                height: this.getRowDimensionsFromElements(parseInt(row))
            };
        }
    }

    private getRowDimensionsFromElements(row: number): number {
        let height: number = 0,
            elementUnit = this.data.dimensions.width;

        for (let element of this.data.matrix[row]) {
            if (element.isDetail) {
                this.getElementHeight(element.id);
            } else {
                height = elementUnit / (this.data.dimensions.elementsPerRow);
            }
        }

        return height;
    }

    private getElementHeight(elementId: number) {
        let $element = _.get(this.data.elements, [elementId, "element"]);

        if ($element.length) {
            return $element.height();
        } else {
            throw new Error("Element could not be found! There is no element with this id!");
        }
    }

    private getRowDimensionsFromData(row: number): number {
        let height = 0;

        height = _.get(this.data.dimensions, ["rows", row]);

        return height;
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

    private setData() {
        this.data["dimensions"] = {
            width: $(this.data.config.selectorContainer).width(),
            browser: {
                height: window.innerHeight || document.body.clientHeight,
                width: window.innerWidth || document.body.clientWidth
            }
        };
        this.data["dimensions"]["elementsPerRow"] = this.getElementsPerRow();
        // reduce the elementsPerRowArrays to avoid mistakes based on arrays start counting from 0
        this.data["dimensions"]["elementsPerRowArray"] = this.data.dimensions.elementsPerRow - 1;
    }

    private getElementsPerRow(): number {
        let elementsPerRow: number = this.data.config.elementsPerRow,
            tilewallWidth: number = this.data.dimensions.width;
        _.sortBy(this.data.config.responsive, "width");

        _.forEach(this.data.config.responsive, function (value, key) {
            console.log(value);
            if (value.width >= tilewallWidth) {
                elementsPerRow = value.elementsPerRow;
            }
        });

        return elementsPerRow;
    }
    // endregion


    // region public methods
    // api to give the data of the wall
    // ToDo: is it good to give all data?
    // ToDo: Change return type
    public getData(): any {
        return this.data;
    }

    public onInitialized(callback: () => void) {
        if (this.data.elements) {
            callback();
        } else {
            this.onInitialized(callback);
        }
    }

    // ToDo: change type of $element to jQuery
    public insertCustomElementToSpecificMatrixPosition(row: number, $element: any) {
        let id = 999;

        if (this.matrixNewLineAtSpecificRow(row)) {
            this.data.elements[id] = this.createElementData(id, $element, 1, 4, true);
            this.saveElementToMatrix(row, 0, id, 1, 4);
            $element.attr(this.data.config.elementKeyId, id);
            this.assignStylesToElements($element, true, this.getElementHeight(id));
            this.assignPositionToElements($element, id);
            $element.detach().appendTo($(this.data.config.selectorContainer));
            this.refreshStylesOfElements();
            console.log(this.data);
        }
    }

    public getElementData(id: number) {
        return this.data.elements[id];
    }
    // endregion
}