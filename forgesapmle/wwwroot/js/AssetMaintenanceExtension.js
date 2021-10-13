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


// *******************************************
// Asset maintenance Extension
// *******************************************
function AssetMaintenanceExtension(viewer, options) {
    Autodesk.Viewing.Extension.call(this, viewer, options);
    this.viewer = viewer;
    this.loadRecordPanel = null;
    this.createReportPanel = null;
}

AssetMaintenanceExtension.prototype = Object.create(Autodesk.Viewing.Extension.prototype);
AssetMaintenanceExtension.prototype.constructor = AssetMaintenanceExtension;

AssetMaintenanceExtension.prototype.load = function () {

    this.onSelectionBinded = this.onSelectionEvent.bind(this);

    const updateIconsCallback = () => {
        this.updateIcons();
    };

    this.viewer.addEventListener(Autodesk.Viewing.AGGREGATE_SELECTION_CHANGED_EVENT, this.onSelectionBinded);
    this.viewer.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, updateIconsCallback);
    this.viewer.addEventListener(Autodesk.Viewing.ISOLATE_EVENT, updateIconsCallback);
    this.viewer.addEventListener(Autodesk.Viewing.HIDE_EVENT, updateIconsCallback);
    this.viewer.addEventListener(Autodesk.Viewing.SHOW_EVENT, updateIconsCallback);

    if (this.viewer.toolbar) {
        // Toolbar is already available, create the UI
        this.createUI();
    } else {
        // Toolbar hasn't been created yet, wait until we get notification of its creation
        this.onToolbarCreatedBinded = this.onToolbarCreated.bind(this);
        this.viewer.addEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT, this.onToolbarCreatedBinded);
    }
    return true;
};

AssetMaintenanceExtension.prototype.onToolbarCreated = function () {
    this.viewer.removeEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT, this.onToolbarCreatedBinded);
    this.onToolbarCreatedBinded = null;
    this.createUI();
};

AssetMaintenanceExtension.prototype.onSelectionEvent = function (event) {

    var selections = event.selections;

    var firstSelection = selections[0];

    var model = firstSelection.model;
    var dbIds = firstSelection.dbIdArray;
    var firstDbId = dbIds[0];

    model.getProperties(firstDbId, function (result) {

        var objectProp = result;

        var assetId = "";

        for(var i = 0; i < objectProp.properties.length; i++) {

            var familyProp = objectProp.properties[i];

            if (familyProp.displayName === "AssetId" && familyProp.displayValue.length > 0) {

                assetId = familyProp.displayValue;
            }

            if (assetId !== "") {
                $('#create-maintenance-report-panel #asset_name').attr('value', objectProp.name);
                $('#create-maintenance-report-panel #asset_name').attr('data-revit_guid', objectProp.externalId);
                $('#create-maintenance-report-panel #asset_name').attr('data-dbid', objectProp.dbId);
                $('#create-maintenance-report-panel #asset_name').attr('data-aggregated_model_index', model.id);
                $('#create-maintenance-report-panel #asset_name').attr('data-asset_id', assetId);
            }
            else {
                $('#create-maintenance-report-panel #asset_name').attr('value', "アセットを選択してください。");
                $('#create-maintenance-report-panel #asset_name').attr('data-revit_guid', "");
                $('#create-maintenance-report-panel #asset_name').attr('data-dbid', "");
                $('#create-maintenance-report-panel #asset_name').attr('data-aggregated_model_index', "");
                $('#create-maintenance-report-panel #asset_name').attr('data-asset_id', "");
            }
        };
    });
};

AssetMaintenanceExtension.prototype.createUI = function () {
    var _this = this;

    // SubToolbar
    _this.subToolbar = (this.viewer.toolbar.getControl("MyAppToolbar") ?
        _this.viewer.toolbar.getControl("MyAppToolbar") :
        new Autodesk.Viewing.UI.ControlGroup('MyAppToolbar'));
    _this.viewer.toolbar.addControl(this.subToolbar);

    // load/render mainteance record button
    {
        var loadMaintenanceRecords = new Autodesk.Viewing.UI.Button('loadMaintenanceRecords');
        loadMaintenanceRecords.onClick = function (e) {
            // check if the panel is created or not
            if (_this.loadRecordPanel == null) {
                _this.loadRecordPanel = new LoadRecordPanel(_this.viewer, _this.viewer.container, 'load-maintenance-records-panel', 'アセット修繕履歴');
            }
            // show/hide docking panel
            _this.loadRecordPanel.setVisible(!_this.loadRecordPanel.isVisible());

            // if panel is NOT visible, exit the function
            if (!_this.loadRecordPanel.isVisible()) return;

            // ok, it's visible, let's load the issues
            _this.loadRecords(_this.viewer);

        };
        loadMaintenanceRecords.addClass('load-maintenance-records-panel-style');
        loadMaintenanceRecords.setToolTip('Show Issues');
        _this.subToolbar.addControl(loadMaintenanceRecords);
    }

    // create maintenance report
    {
        var createMaintenanceReport = new Autodesk.Viewing.UI.Button('createMaintenanceReport');
        createMaintenanceReport.onClick = function (e) {
            // check if the panel is created or not
            if (_this.createReportPanel == null) {

                var template = document.querySelector('#create-maintenance-report-panel-content');

                var clone = document.importNode(template.content, true);

                _this.createReportPanel = new CreateReportPanel(_this.viewer, _this.viewer.container, 'create-maintenance-report-panel', '問題の報告', clone, 10, 10);
            }
            // show/hide docking panel
            _this.createReportPanel.setVisible(!_this.createReportPanel.isVisible());

            // if panel is NOT visible, exit the function
            //if (!_this.createReportPanel.isVisible()) return;

        };
        createMaintenanceReport.addClass('create-maintenance-report-panel-style');
        createMaintenanceReport.setToolTip('Report Issue');
        this.subToolbar.addControl(createMaintenanceReport);
    }
};

AssetMaintenanceExtension.prototype.unload = function () {

    this.viewer.removeEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, this.onSelectionBinded);
    this.onSelectionBinded = null;

    this.viewer.toolbar.removeControl(this.subToolbar);

    return true;
};

Autodesk.Viewing.theExtensionManager.registerExtension('AssetMaintenanceExtension', AssetMaintenanceExtension);

// *******************************************
// Load Record Panel
// *******************************************
function LoadRecordPanel(viewer, container, id, title, options) {
    this.viewer = viewer;
    Autodesk.Viewing.UI.PropertyPanel.call(this, container, id, title, options);
}
LoadRecordPanel.prototype = Object.create(Autodesk.Viewing.UI.PropertyPanel.prototype);
LoadRecordPanel.prototype.constructor = LoadRecordPanel;

// *******************************************
// Create Report Panel
// *******************************************
CreateReportPanel = function (viewer, container, id, title, content, x, y) {
    this.viewer = viewer;
    this.content = content;
    Autodesk.Viewing.UI.DockingPanel.call(this, container, id, title);

    this.container.style.height = "500px";
    this.container.style.width = "300px";
    this.container.style.minHeight = "500px";
    this.container.style.minWidth = "300px";
    this.container.style.resize = "none";
    this.container.style.left = x + "px";
    this.container.style.top = y + "px";

}
CreateReportPanel.prototype = Object.create(Autodesk.Viewing.UI.DockingPanel.prototype);
CreateReportPanel.prototype.constructor = CreateReportPanel;

CreateReportPanel.prototype.initialize = function () {
    var _this = this;

    this.title = this.createTitleBar(this.titleLabel || this.container.id);
    this.container.appendChild(this.title);
    this.container.appendChild(this.content);

    var viewer = this.viewer;

    $(document).on('click', '#create-maintenance-report-panel .btn-create-maintenance-report', function () {

        var dbId = $('#create-maintenance-report-panel #asset_name').attr('data-dbid');

        var modelIndex = $('#create-maintenance-report-panel #asset_name').attr('data-aggregated_model_index');

        var models = viewer.getAllModels();

        var urn;

        for (var i = 0; i < models.length; i++) {

            if (models[i].id == modelIndex) {

                urn = models[i].myData.urn;
            }
        }

        if (!dbId) {
            alert("アセットが選択されていません。");
        }
        else {

            var formData = new FormData();
            formData.append('data', JSON.stringify({
                modelId: $('#user-hubs').find('li[id^="' + urn + '"]').parent().parent().attr('id'),
                assetName: $('#create-maintenance-report-panel #asset_name').val(),
                assetId: $('#create-maintenance-report-panel #asset_name').attr('data-asset_id'),
                title: $('#create-maintenance-report-panel #report_title').val(),
                description: $('#create-maintenance-report-panel #report_description').val(),
                priority: $('#create-maintenance-report-panel #report_priority').val(),
                revitGuid: $('#create-maintenance-report-panel #asset_name').attr('data-revit_guid')
            }));

            $.ajax({
                url: 'api/forge/fm_revit/create_report',
                data: formData,
                processData: false,
                contentType: false,
                type: 'Post',
                success: function (res) {
                    console.log('Finished creating maintenance report.');

                    alert("レポートを登録しました。");
                }
            });
        }
    });

    this.closer = this.getDocument().querySelector("#create-maintenance-report-panel .docking-panel-close");
    this.initializeCloseHandler(this.closer);
    this.container.appendChild(this.closer);
}

AssetMaintenanceExtension.prototype.loadRecords = function (viewer) {

    var _this = this;

    var models = viewer.getAllModels();

    for (var i = 0; i < models.length; i++) {

        var modelIndex = models[i].id;
        var urn = models[i].myData.urn;
        var modelId = $('#user-hubs').find('li[id^="' + urn + '"]').parent().parent().attr('id');

        console.log(modelId);

        var pathArr = modelId.split('/');

        $.ajax({
            url: 'api/forge/revit_fm/maintenance_records',
            data: {
                projectId: pathArr[6],
                itemId: pathArr[8]
            },
            type: 'GET',
            success: function (res) {
                console.log('Finished getting maintenance records.');

                _this.loadRecordPanel.removeAllProperties();

                if (res.length > 0) {
                    _this.showRecords(res);
                }
            }
        });
    }
}

AssetMaintenanceExtension.prototype.showRecords = function (maintenanceRecords) {

    var _this = this;

    console.log(maintenanceRecords);

    maintenanceRecords.forEach(function (record) {

        if (_this.loadRecordPanel) {
            _this.loadRecordPanel.addProperty('Title', record.title, "レポート Id" + record.reportId);
            _this.loadRecordPanel.addProperty('AssetName', record.assetName, "レポート Id" + record.reportId);
            _this.loadRecordPanel.addProperty('AssetId', record.assetId, "レポート Id" + record.reportId);
            _this.loadRecordPanel.addProperty('Description', record.description, "レポート Id" + record.reportId);
            _this.loadRecordPanel.addProperty('Priority', record.priority, "レポート Id" + record.reportId);
            _this.loadRecordPanel.addProperty('Status', record.status, "レポート Id" + record.reportId);
            //_this.panel.addProperty('Created at', dateCreated.format('MMMM Do YYYY, h:mm a'), 'Issue ' + issue.attributes.identifier);
            //_this.panel.addProperty('Assigned to', issue.attributes.assigned_to_name, 'Issue ' + issue.attributes.identifier);

            var externalId = record.assetRevitGuid;

            var models = _this.viewer.getAllModels();

            for (var i = 0; i < models.length; i++) {

                var modelIndex = models[i].id;
                var urn = models[i].myData.urn;
                var modelId = $('#user-hubs').find('li[id^="' + urn + '"]').parent().parent().attr('id');

                if (modelId == record.modelId) {

                    models[i].getExternalIdMapping(function (data) {

                        let tmp = Object.entries(data);

                        var map = new Map(tmp)

                        var iconData = { modelIndex: modelIndex, dbId: map.get(externalId), label: "故障", css: 'iconWarning fas fa-exclamation-triangle fa-2x faa-flash animated' };

                        _this.showIcon(iconData);

                    });
                }
            }
        }
    });
}

AssetMaintenanceExtension.prototype.updateIcons = function() {
    for (const label of $('#' + this.viewer.clientContainer.id + ' div.adsk-viewing-viewer .update')) {
        const $label = $(label);
        const id = $label.data('id');
        const modelIndex = $label.data('modelIndex');

        // get the center of the dbId (based on its fragIds bounding boxes)
        const pos = this.viewer.worldToClient(this.getModifiedWorldBoundingBox(modelIndex, id).center());

        // position the label center to it
        $label.css('left', Math.floor(pos.x - $label[0].offsetWidth / 2) + 'px');
        $label.css('top', Math.floor(pos.y - $label[0].offsetHeight / 2) + 'px');
        $label.css('display', this.viewer.isNodeVisible(id) ? 'block' : 'none');
    }
}

AssetMaintenanceExtension.prototype.getModifiedWorldBoundingBox = function (modelIndex, dbId) {

    var models = this.viewer.getAllModels();
    var fragList;

    for (var i = 0; i < models.length; i++) {

        if (models[i].id == modelIndex) {

            fragList = models[i].getFragmentList();
        }
    }

    const nodebBox = new THREE.Box3()

    // for each fragId on the list, get the bounding box
    for (const fragId of this._frags['dbId' + dbId]) {
        const fragbBox = new THREE.Box3();
        fragList.getWorldBounds(fragId, fragbBox);
        nodebBox.union(fragbBox); // create a unifed bounding box
    }

    return nodebBox
}

AssetMaintenanceExtension.prototype.showIcon = function(icon) {
    const $viewer = $('#' + this.viewer.clientContainer.id + ' div.adsk-viewing-viewer');

    // remove previous...
    $('#' + this.viewer.clientContainer.id + ' div.adsk-viewing-viewer label.markup').remove();

    // do we have anything to show?
    if (icon === undefined || icon === null) return;

    var models = this.viewer.getAllModels();
    var tree;

    for (var i = 0; i < models.length; i++) {

        if (models[i].id == icon.modelIndex) {

            tree = models[i].getInstanceTree();
        }
    }

    if (tree === undefined) { console.log('Loading tree...'); return; }

    const onClick = (e) => {
        if (this.options.onClick)
            this.options.onClick($(e.currentTarget).data('id'));
    };

    this._frags = {}

    // we need to collect all the fragIds for a given dbId
    this._frags['dbId' + icon.dbId] = []

    // create the label for the dbId
    const $label = $(`
            <label class="markup update" data-id="${icon.dbId}" data-model-index="${icon.modelIndex}">
                <span class="${icon.css}"> ${icon.label || ''}</span>
            </label>
            `);
    $label.css('display', this.viewer.isNodeVisible(icon.dbId) ? 'block' : 'none');
    $label.on('click', onClick);
    $viewer.append($label);

    // now collect the fragIds
    const _this = this;
    tree.enumNodeFragments(icon.dbId, function (fragId) {
        _this._frags['dbId' + icon.dbId].push(fragId);
        _this.updateIcons(); // re-position of each fragId found
    });
}