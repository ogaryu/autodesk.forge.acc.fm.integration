/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Forge Partner Development
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////

var firstViewer;
var aggregatedViewer;
var secondViewer;

function getForgeToken(callback) {
    fetch('/api/forge/oauth/token').then(res => {
        res.json().then(data => {
            callback(data.access_token, data.expires_in);
        });
    });
}

function launchViewer(urn, viewableId) {

    finishAllViewer();

    $('#first-viewer-column').removeClass('col-sm-6');
    $('#first-viewer-column').addClass('col-sm-12');

    $('#second-viewer-column').removeClass('col-sm-6');
    $('#second-viewer-column').removeClass('col-sm-12');

    $('#first-viewer').css('width', '100%');

    var options = {
        env: 'AutodeskProduction',
        getAccessToken: getForgeToken
    };

    Autodesk.Viewing.Initializer(options, () => {

        var config3d = {
            loaderExtensions: { svf: "Autodesk.MemoryLimited" },
            extensions: [
                'FacilityManagementIntegrationExtension'
            ]
        };

        firstViewer = new Autodesk.Viewing.GuiViewer3D(document.getElementById('first-viewer'), config3d);

        firstViewer.start();
        var documentId = 'urn:' + urn;
        Autodesk.Viewing.Document.load(documentId, onDocumentLoadSuccess, onDocumentLoadFailure);
    });

    function onDocumentLoadSuccess(doc) {

        var viewables = (viewableId ? doc.getRoot().findByGuid(viewableId) : doc.getRoot().getDefaultGeometry());

        doc.downloadAecModelData();

        firstViewer.loadDocumentNode(doc, viewables);
    }

    function onDocumentLoadFailure(viewerErrorCode) {
        console.error('onDocumentLoadFailure() - errorCode:' + viewerErrorCode);
    }
}

function launchAggregatedViewer(treeNodes) {

    finishAllViewer();

    $('#first-viewer-column').removeClass('col-sm-6');
    $('#first-viewer-column').addClass('col-sm-12');

    $('#second-viewer-column').removeClass('col-sm-6');
    $('#second-viewer-column').removeClass('col-sm-12');

    $('#first-viewer').css('width', '100%');

    const options = {
        env: 'AutodeskProduction',
        getAccessToken: getForgeToken
    };

    function loadManifest(documentId) {
        return new Promise((resolve, reject) => {
            const onDocumentLoadSuccess = (doc) => {
                doc.downloadAecModelData(() => resolve(doc));
            };
            Autodesk.Viewing.Document.load(documentId, onDocumentLoadSuccess, reject);
        });
    }

    var view = new Autodesk.Viewing.AggregatedView();

    Autodesk.Viewing.Initializer(options, function () {

        const viewerDiv = document.getElementById('first-viewer');

        view.init(viewerDiv);

        firstViewer = view.viewer;

        firstViewer.loadExtension('AssetMaintenanceExtension');

        const tasks = [];

        treeNodes.forEach(treeNode => tasks.push(loadManifest('urn:' + treeNode.id.split('/')[0])));

        Promise.all(tasks)
            .then(docs => Promise.resolve(docs.map(doc => {
                const bubbles = doc.getRoot().search({ type: 'geometry', role: '3d' });
                const bubble = bubbles[0];
                if (!bubble) return null;

                return bubble;
            })))
            .then(bubbles => view.setNodes(bubbles));
    });
}

function launchMultipleViewer(urn1, urn2) {

    finishAllViewer();

    $('#first-viewer-column').removeClass('col-sm-12');
    $('#first-viewer-column').addClass('col-sm-6');

    $('#second-viewer-column').removeClass('col-sm-12');
    $('#second-viewer-column').addClass('col-sm-6');

    $('#first-viewer').css('width', '100%');

    var options = {
        env: 'AutodeskProduction',
        getAccessToken: getForgeToken
    };

    Autodesk.Viewing.Initializer(options, () => {

        var config3d = {
            loaderExtensions: { svf: "Autodesk.MemoryLimited" }
        };

        firstViewer = new Autodesk.Viewing.GuiViewer3D(document.getElementById('first-viewer'), config3d);
        firstViewer.start();
        firstViewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, onSelectedFamilyInFamilyContext);
        loadModel(firstViewer, urn1);

        secondViewer = new Autodesk.Viewing.GuiViewer3D(document.getElementById('second-viewer'), config3d);
        secondViewer.start();
        secondViewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, onSelectedFamilyInProjectContext);
        loadModel(secondViewer, urn2);
    });

    async function loadModel(viewer, urn, guid) {
        return new Promise(function (resolve, reject) {
            function onDocumentLoadSuccess(doc) {
                Autodesk.Viewing.Document.getAecModelData(doc.getRoot()).then(aec => console.log('AEC metadata', aec));
                resolve(viewer.loadDocumentNode(doc, guid ? doc.getRoot().findByGuid(guid) : doc.getRoot().getDefaultGeometry()));
            }
            function onDocumentLoadFailure(code, message) {
                console.error('Could not load document.', message);
                reject(message);
            }
            Autodesk.Viewing.Document.load('urn:' + urn, onDocumentLoadSuccess, onDocumentLoadFailure);
        });
    };

    function onSelectedFamilyInFamilyContext(event) {
        var dbIdArray = event.dbIdArray;
        if (dbIdArray.length > 0) {
            firstViewer.clearSelection();
            firstViewer.isolate(dbIdArray);
            firstViewer.fitToView(dbIdArray);

            firstViewer.getProperties(dbIdArray[0], function (result) {

                var objectProp = result;

                var familyInstanceName = objectProp.name;
                var familyInstanceGuid = objectProp.externalId;
                var familyTypeName;
                var familyCategoryName;

                for (var i = 0; i < objectProp.properties.length; i++) {

                    var familyProp = objectProp.properties[i];

                    switch (familyProp.displayName) {
                        case "Category":
                            familyCategoryName = familyProp.displayValue;
                            break;
                        case "タイプ名":
                            familyTypeName = familyProp.displayValue;
                            break;
                    }
                };

                var currentRvtUrn = firstViewer.impl.model.myData.urn;
                var currentRvtName = $('#user-hubs').find('a[id="' + currentRvtUrn + '_anchor"]').parent().parent().parent().find('a:first').text();
                var targetRfaName = currentRvtName.replace("rvt", "rfa");
                var folderDom = $('#user-hubs').find('li[id^="' + currentRvtUrn + '"]').parent().parent().parent().parent();
                var targetRfaUrn = $(folderDom).find('ul li a:contains("' + targetRfaName + '")').parent().find('ul li:last').attr('id');

                var itemUrlStr = $('#user-hubs').find('li[id^="' + targetRfaUrn + '"]').attr('id')
                var folderUrlStr = $('#user-hubs').find('li[id^="' + targetRfaUrn + '"]').parent().parent().parent().parent().attr('id');
                var targetId = $('#user-hubs').find('li[id^="' + targetRfaUrn + '"]').parent().parent().attr('id');
                var itemNameStr = $('#user-hubs').find('a[id="' + targetId + '_anchor"]').text();

                $('#selected-family-type').val(objectProp.name);
                $('#selected-family-type-item-url').val(itemUrlStr);
                $('#selected-family-type-folder-url').val(folderUrlStr);
                $('#selected-family-type-item-name').val(itemNameStr);
                $('#selected-family-type-instance-guid').val(familyInstanceGuid);
                $('#selected-family-type-name').val(familyTypeName);
                $('#selected-family-type-category').val(familyCategoryName);
            }); 
        }
    }

    function onSelectedFamilyInProjectContext(event) {
        var dbIdArray = event.dbIdArray;
        if (dbIdArray.length > 0) {
            secondViewer.clearSelection();
            secondViewer.isolate(dbIdArray);
            secondViewer.fitToView(dbIdArray);

            secondViewer.getProperties(dbIdArray[0], function (result) {

                var objectProp = result;

                var familyInstanceName = objectProp.name;
                var familyInstanceGuid = objectProp.externalId;
                var familyTypeName;
                var familyCategoryName;

                for (var i = 0; i < objectProp.properties.length; i++) {

                    var familyProp = objectProp.properties[i];

                    switch (familyProp.displayName) {
                        case "Category":
                            familyCategoryName = familyProp.displayValue;
                            break;
                        case "タイプ名":
                            familyTypeName = familyProp.displayValue;
                            break;
                    }
                };

                var urn = secondViewer.impl.model.myData.urn;
                var itemUrlStr = $('#user-hubs').find('li[id^="' + urn + '"]').attr('id');
                var folderUrlStr = $('#user-hubs').find('li[id^="' + urn + '"]').parent().parent().parent().parent().attr('id');
                var targetId = $('#user-hubs').find('li[id^="' + urn + '"]').parent().parent().attr('id');
                var itemNameStr = $('#user-hubs').find('a[id="' + targetId + '_anchor"]').text();

                $('#selected-family-instance').val(objectProp.name);
                $('#selected-family-instance-item-url').val(itemUrlStr);
                $('#selected-family-instance-folder-url').val(folderUrlStr);
                $('#selected-family-instance-item-name').val(itemNameStr);
                $('#selected-family-instance-guid').val(familyInstanceGuid);
                $('#selected-family-instance-type-name').val(familyTypeName);
                $('#selected-family-instance-category').val(familyCategoryName);
            });
        }
    }
}

function launchDiffViewer(treeNodes) {

    finishAllViewer();

    $('#first-viewer-column').removeClass('col-sm-6');
    $('#first-viewer-column').addClass('col-sm-12');

    $('#second-viewer-column').removeClass('col-sm-6');
    $('#second-viewer-column').removeClass('col-sm-12');

    $('#first-viewer').css('width', '1400px');

    var models = [];

    treeNodes.forEach(treeNode => {
        models.push({ name: treeNode.text, urn: "urn:" + treeNode.id.split('/')[0]});
    });

    const options = {
        env: 'AutodeskProduction',
        getAccessToken: getForgeToken
    };

    Autodesk.Viewing.Initializer(options, function () {

        const viewerDiv = document.getElementById('first-viewer');

        firstViewer = new Autodesk.Viewing.Private.GuiViewer3D(viewerDiv);

        const util = new MultipleModelUtil(firstViewer);
        util.processModels(models).then(() => {

            var extensionConfig = {}
            extensionConfig.mimeType = 'application/vnd.autodesk.revit'
            extensionConfig.primaryModels = [firstViewer.getVisibleModels()[0]]
            extensionConfig.diffModels = [firstViewer.getVisibleModels()[1]]
            extensionConfig.diffMode = 'overlay'
            extensionConfig.versionA = '2'
            extensionConfig.versionB = '1'
            firstViewer.loadExtension('Autodesk.DiffTool', extensionConfig);

        });

    });
}

function finishAllViewer() {
    if (firstViewer) {
        firstViewer.finish();
        firstViewer = null;
    }
    if (secondViewer) {
        secondViewer.finish();
        secondViewer = null;
    }
    Autodesk.Viewing.shutdown();
}