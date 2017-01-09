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
    private matrix: {}[];
    private tilewallData: {};
    // endregion

    constructor(config: {}) {
        this.config = _.defaults(config, this.config);

        this.setup();
    }

    private setup() {
        this.createTmpContainer();
        this.mapElements();

        this.matrixNewLine();

        console.log(this.matrix);
    }

    private createTmpContainer() {
        // Create the tmp-container for the elements
        $(this.config.selectorContainer).after("<div class='" + this.config.classTmpContainer + "'></div>");

        // Assign a selector for the new tmp-container to the config
        _.assign(this.config, {"selectorTmpContainer": "." + this.config.classTmpContainer});
    }

    private mapElements(): Contracts.IElementsMap {
        let _this = this;
        let map = [];

        $(this.config.selectorContainer).children().each(function () {
            // console.log($(this));
            map.push({
                "element": $(this),
                "size": {
                    "height": $(this).attr(_this.config.elementKeyHeight),
                    "width": $(this).attr(_this.config.elementKeyWidth)
                }
            });
        });

        console.log(map);
        return map;
    }

    private distributeElementsOnMatrix(ElementsMap: Contracts.IElementsMap) {
        _.forEach(ElementsMap, (value, key) => {
            ElementsMap[key].height;
        });
    }

    private findFreeSpaceForElementInMatrix(element: {}) {

    }

    private matrixNewLine() {
        // initialize the matrix
        if (_.isEmpty(this.matrix)) {
            this.matrix = [];
        }
        this.matrix.push({});
    }

    // api to give the data of the wall
    public get TilewallData(): any {
        return this.tilewallData;
    }

    // shpuld not be open for public
    // // api to set the data of the wall
    // public set TilewallData(tilewallData: {}) {
    //      this.tilewallData = _.defaults(tilewallData, this.tilewallData);
    // }
}