   require([
        "esri/Map",
        "esri/views/SceneView",
        "esri/layers/Layer",
        "esri/layers/FeatureLayer",
        "esri/Graphic",
        "esri/widgets/Expand",
        "esri/widgets/Home",
        "esri/widgets/Legend",
        "esri/layers/GraphicsLayer",
        "esri/tasks/support/Query",
        "esri/tasks/QueryTask",
        "esri/widgets/Search",
        "esri/widgets/BasemapGallery",
        "esri/widgets/LayerList",
        "esri/geometry/Extent",
        "esri/Viewpoint",
        "esri/core/watchUtils",
        "dojo/on",
        "dojo/dom",
        "dojo/domReady!"
      ],
      function(
        Map, SceneView, Layer, FeatureLayer, Graphic,
        Expand, Home, Legend, GraphicsLayer, Query, QueryTask, Search,
        BasemapGallery, LayerList, Extent, Viewpoint, watchUtils, on, dom
      ) {

        var projectsURL = "https://services5.arcgis.com/PADY1WtQSQ4Ijq5k/arcgis/rest/services/projectsBiologicalMonitoring/FeatureServer/0/query?where=1+%3D+1&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=*&returnHiddenFields=false&returnGeometry=true&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnDistinctValues=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson&token=z40rT6Z-38a7WwypNyhY8QjKEYb8QtY728o10cVg8xioX0zJoas5uud1in_yROvLv1FKkBI-bgrMoEkL648lHMgslO3NQmEt9YSiac4_8Ftc9BvLj1ihc45oG2bh4aTJ5ctO8D5ile8WE9CLPYlEMOwNqtQNaRcH3FAUN2SZ8qLdbRcXQYfIWKkesU3QxR1DL3N0o5nFAlLDh4fjUPmZECEVruN6e6bgqkLoxKr_-fG6HYw8SO4hky-wp15IZn8x";

        var r = $.ajax({
          type:'GET',
          url:projectsURL,
          data:'',
          dataType:'json',
          success:function(data){dom.byId("infoDiv").innerHTML = "<h1>" + data.features+ "</h1>"; console.log(data)},
          error:function(xhr, ajaxOptions, thrownError) {
            dir(thrownError);
            dir(xhr);
            dir(ajaxOptions);}
        });

        var editExpand;

        //TESEDIT -- lots of variables declared - but where do they come back again?
        // feature edit area domNodes
        var editArea, attributeEditing, inputName,
          inputNumber, inputPTL, inputWaterBody, inputUseClass, inputCounty,
          inputProjectDescription, inputPreviousCollection;

        var map = new Map({
          basemap: "topo",
          ground: "world-elevation"
        });

        // initial extent of the view and home button
        var initialExtent = new Extent({
          xmin: -13663687.72791,
          xmax: -8312216.14650327,
          ymin: 2892355.57310079,
          ymax: 6464666.88583068,
          spatialReference: 102100
        });

        var view = new SceneView({
          container: "viewDiv",
          map: map,
          extent: initialExtent
        });

        //TESEDIT -- these are the added map layers
        //add an editable featurelayer from portal
        var projectsLayer = new FeatureLayer({
          portalItem: { // autocasts as new PortalItem()
            id: "067c4c4a93274810bf2083a15c5ee538"
          },
          outFields: ["*"],
          visible: true
        });

        // Add the layer
        map.add(projectsLayer);

        setupEditing();
        setupView();

        function addLayer(lyr) {
          projectsLayer = lyr;
          map.add(lyr);
        }

        //TESEDITS -- applyEdits function - takes parameters, declares a variable 'promise' -- will need to do this for two different layer files...
        function applyEdits(params) {
          unselectFeature();
          var promise = projectsLayer.applyEdits(params);
          editResultsHandler(promise);
        }

        var sitesLayer = new FeatureLayer({
          portalItem: { // autocasts as new PortalItem()
            id: "d01822b6662145e4b1b3c9480c7bf50d"
          },
          outFields: ["*"],
          visible: true
        });

        map.add(sitesLayer)

        //TESEDITS -- 'query the newly created feature' - set the editFeature object and update the features...
        // *****************************************************
        // applyEdits promise resolved successfully
        // query the newly created feature from the featurelayer
        // set the editFeature object so that it can be used
        // to update its features.
        // *****************************************************
        function editResultsHandler(promise) {
          promise
            .then(function(editsResult) {
              var extractObjectId = function(result) {
                console.log(result.objectId)
                return result.objectId;
              };

              // get the objectId of the newly added feature
              if (editsResult.addFeatureResults.length > 0) {
                var adds = editsResult.addFeatureResults.map(
                  extractObjectId);
                newIncidentId = adds[0];

                selectFeature(newIncidentId);
              }
            })
            .otherwise(function(error) {
              console.log("===============================================");
              console.error("[ applyEdits ] FAILURE: ", error.code, error.name,
                error.message);
              console.log("error = ", error);
            });
        }

        // *****************************************************
        // listen to click event on the view
        // 1. select if there is an intersecting feature
        // 2. set the instance of editFeature
        // 3. editFeature is the feature to update or delete
        // *****************************************************
        view.on("click", function(evt) {
          unselectFeature();
          view.hitTest(evt).then(function(response) {
            if (response.results.length > 0 && response.results[0].graphic) {

              var feature = response.results[0].graphic;
              selectFeature(feature.attributes[projectsLayer.objectIdField]);

              dom.byId("infoDiv").innerHTML = "<h1>" + feature.attributes[
                "ProjectName"] + "</h1>"

              inputName.value = feature.attributes[
                "ProjectName"];
              inputNumber.value = feature.attributes[
                "ProjectNumber"];
              inputPTL.value = feature.attributes[
                "ProjectTeamLead"];
              inputWaterBody.value = feature.attributes[
                "WaterBody"];
              inputUseClass.value = feature.attributes[
                "UseClass"];
              inputCounty.value = feature.attributes[
                "County"];
              inputProjectDescription.value = feature.attributes[
                "ProjectDescription"];
              inputPreviousCollection.value = feature.attributes[
                "PreviousCollection"];
              attributeEditing.style.display = "block";
              updateInstructionDiv.style.display = "none";
            }
          });
        });

        // *****************************************************
        // select Feature function
        // 1. Select the newly created feature on the view
        // 2. or select an existing feature when user click on it
        // 3. Symbolize the feature with cyan rectangle
        // *****************************************************
        function selectFeature(objectId) {
          // symbol for the selected feature on the view
          var selectionSymbol = {
            type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
            color: [0, 0, 0, 0],
            style: "square",
            size: "40px",
            outline: {
              color: [0, 255, 255, 1],
              width: "3px"
            }
          };
          var query = projectsLayer.createQuery();
          query.where = projectsLayer.objectIdField + " = " + objectId;

          projectsLayer.queryFeatures(query).then(function(results) {
            if (results.features.length > 0) {
              editFeature = results.features[0];
              editFeature.symbol = selectionSymbol;
              view.graphics.add(editFeature);
            }
          });
        }

        // *****************************************************
        // hide attributes update and delete part when necessary
        // *****************************************************
        function unselectFeature() {
          attributeEditing.style.display = "none";
          updateInstructionDiv.style.display = "block";

          inputName.value = null;
          inputNumber.value = null;
          inputPTL.value = null;
          inputWaterBody.value = null;
          inputUseClass.value = null;
          inputCounty.value = null;
          inputProjectDescription.value = null;
          inputPreviousCollection.value = null;
          view.graphics.removeAll();
        }

        // *****************************************************
        // add homeButton and expand widgets to UI
        // *****************************************************
        function setupView() {
          // set home buttone view point to initial extent
          var homeButton = new Home({
            view: view,
            viewpoint: new Viewpoint({
              targetGeometry: initialExtent
            })
          });
          view.ui.add(homeButton, "top-left");

          //expand widget
          editExpand = new Expand({
            expandIconClass: "esri-icon-edit",
            expandTooltip: "Expand Edit",
            expanded: false,
            view: view,
            content: editArea
          });
          view.ui.add(editExpand, "top-right");
        }

        // *****************************************************
        // set up for editing // TESEDITS -- how to populate these input Areas based on
        //                        button selection, either sites or project locations...
        // *****************************************************
        function setupEditing() {
          // input boxes for the attribute editing
          editArea = dom.byId("editArea");
          updateInstructionDiv = dom.byId("updateInstructionDiv");
          attributeEditing = dom.byId("featureUpdateDiv");
          inputName = dom.byId("inputName");
          inputNumber = dom.byId("inputNumber");
          inputPTL = dom.byId("inputPTL");
          inputWaterBody = dom.byId("inputWaterBody");
          inputUseClass = dom.byId("inputUseClass");
          inputCounty = dom.byId("inputUseClass");
          inputProjectDescription = dom.byId("inputProjectDescription");
          inputPreviousCollection = dom.byId("inputPreviousCollection");

          // *****************************************************
          // btnUpdate click event
          // update attributes of selected feature
          // *****************************************************
          on(dom.byId("btnUpdate"), "click", function(evt) {
            if (editFeature) {
              editFeature.attributes["ProjectName"] = inputName.value;
              editFeature.attributes["ProjectNumber"] = inputNumber.value;
              editFeature.attributes["ProjectTeamLead"] = inputPTL.value;
              editFeature.attributes["WaterBody"] = inputWaterBody.value;
              editFeature.attributes["UseClass"] = inputUseClass.value;
              editFeature.attributes["County"] = inputCounty.value;
              editFeature.attributes["ProjectDescription"] = inputProjectDescription.value;
              editFeature.attributes["PreviousCollection"] = inputPreviousCollection.value;

              var edits = {
                updateFeatures: [editFeature]
              };

              applyEdits(edits);
            }
          });

          // *****************************************************
          // btnAddFeature click event
          // create a new feature at the click location
          // *****************************************************
          on(dom.byId("btnAddFeature"), "click", function() {
            unselectFeature();
            on.once(view, "click", function(event) {
              event.stopPropagation();

              if (event.mapPoint) {
                point = event.mapPoint.clone();
                point.z = undefined;
                point.hasZ = false;

                newIncident = new Graphic({
                  geometry: point,
                  attributes: {}
                });

                var edits = {
                  addFeatures: [newIncident]
                };

                applyEdits(edits);

                // ui changes in response to creating a new feature
                // display feature update and delete portion of the edit area
                attributeEditing.style.display = "block";
                updateInstructionDiv.style.display = "none";
                dom.byId("viewDiv").style.cursor = "auto";
              }
              else {
                console.error("event.mapPoint is not defined");
              }
            });

            // change the view's mouse cursor once user selects
            // a new incident type to create
            dom.byId("viewDiv").style.cursor = "crosshair";
            editArea.style.cursor = "auto";
          });

          // *****************************************************
          // delete button click event. ApplyEdits is called
          // with the selected feature to be deleted
          // *****************************************************
          on(dom.byId("btnDelete"), "click", function() {
            var edits = {
              deleteFeatures: [editFeature]
            };
            applyEdits(edits);
          });

          // *****************************************************
          // watch for view LOD change. Display Feature editing
          // area when view.zoom level is 2 or higher
          // otherwise hide the feature editing area
          // *****************************************************
          view.then(function() {
            watchUtils.whenTrue(view, "stationary", function() {
              if (editExpand) {
                if (view.zoom <= 2) {
                  editExpand.domNode.style.display = "none";
                }
                else {
                  editExpand.domNode.style.display = "block";
                }
              }
            });
          });
        }

        function handleLayerLoadError(err) {
          console.log("Layer failed to load: ", err);
        }

        //LEGEND

        var legend = new Legend({
          view: view
        });

        var expand4 = new Expand({
          expandIconClass: "esri-icon-layer-list",
          view: view,
          content: legend
        });

        // Add widget to the bottom right corner of the view
        view.ui.add(expand4, "top-right");

        //SEARCH

        var search = new Search({
          view: view
        });
        search.defaultSource.withinViewEnabled = false; // Search outside visible area

        var expand3 = new Expand({
          expandIconClass: "esri-icon-search",
          view: view,
          content: search
        });

        view.ui.add(expand3, "top-right"); // Add to the map

        var basemapGallery = new BasemapGallery({
          view: view
        });

        var expand5 = new Expand({
          expandIconClass: "esri-icon-basemap",
          view: view,
          content: basemapGallery
        });

        view.ui.add(expand5, "top-left");

        view.then(function() {
          var layerList = new LayerList({
            view: view
          });

          var expand6 = new Expand({
            expandIconClass: "esri-icon-collection",
            view: view,
            content: layerList
          });

          // Add widget to the top right corner of the view
          view.ui.add(expand6, "top-right");
        });

      });