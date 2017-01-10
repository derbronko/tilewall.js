///<reference path="../../typings/index.d.ts"/>
// import * as Tilewall from "../../tilewall.js";
import Tilewall from "../../tilewall.js";
import Contracts from "../../tilewall.contracts.js";


const demo = {
    config: {
        selectorContainer: ".tilesContainer",
        classTmpContainer: "tmpTilesContainer",
        stylesTmpContainer: "display: none;",

    },
    init: () => {
        new Tilewall(
            demo.config
        );
    },
};

demo.init();