///<reference path="../../typings/index.d.ts"/>
// import * as Tilewall from "../../tilewall.js";
import Tilewall from "tilewall";
import * as $ from "jquery";
import Contracts from "../../tilewall.contracts.js";


const demo = {
    config: {
        selectorContainer: ".tilesContainer",
    },
    init: () => {
        return new Tilewall(
            demo.config
        );
    }
};

let tilewall = demo.init();

function setEvents() {
    $(demo.config.selectorContainer).children().click(function (event) {
        let elementId = parseInt($(event.target).attr("data-tw-id")),
            elementData = tilewall.getElementData(elementId);

        if($(event.target).hasClass("open")){
            // close
        } else {
            $(event.target).addClass("open");
            getDetailSite(elementData);
        }

    });
}

function getDetailSite(elementData) {
    $.ajax({
        url: "http://localhost:3000/demo/detail_site.html",
        data: ""
    }).done(function (data) {
        // alert(data);
        $("body").append("<div class='tw-tmp'>" + data + "</div>");
        tilewall.insertCustomElementToSpecificMatrixPosition(elementData.position.row + 1, $(".tw-tmp").children());
    });
}

if (!$("body").hasClass("alternative")) {

    tilewall.onInitialized(setEvents);

} else {
    const demo_alternative = {
        config: {
            selectorContainer: ".tilesContainer_Detail",
            classTmpContainer: "tmpTilesContainer_alternative",
            stylesTmpContainer: "display: none;",

        },
        init: () => {
            new Tilewall(
                demo_alternative.config
            );
        },
    };

    demo_alternative.init();

    $(".tilesContainer article").click((event) => {
        $(event.target).addClass("active");
        $(".content_Container").addClass("showDetail");
    });
    $(".backToOverview").click((event) => {
        $(".active").removeClass("active");
        $(".content_Container").removeClass("showDetail");
    });
}