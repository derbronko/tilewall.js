import Tilewall from "../../tilewall";

const demo = {
    config: {
        selectorContainer: ".tilesContainer"
    },
    init: () => {
        let tilewall = new Tilewall(
            demo.config.selectorContainer
        );
    }
};