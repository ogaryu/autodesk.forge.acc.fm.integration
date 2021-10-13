function FacilityManagementIntegrationExtension(viewer, options) {
    Autodesk.Viewing.Extension.call(this, viewer, options);
}

FacilityManagementIntegrationExtension.prototype = Object.create(Autodesk.Viewing.Extension.prototype);
FacilityManagementIntegrationExtension.prototype.constructor = FacilityManagementIntegrationExtension;

FacilityManagementIntegrationExtension.prototype.load = function () {
    console.log('FacilityManagementIntegrationExtension has been loaded');
    return true;
}

FacilityManagementIntegrationExtension.prototype.unload = function () {
    // Clean our UI elements if we added any
    if (this._group) {
        this._group.removeControl(this._button);
        if (this._group.getNumberOfControls() === 0) {
            this.viewer.toolbar.removeControl(this._group);
        }
    }
    console.log('FacilityManagementIntegrationExtension has been unloaded');
    return true;
}

FacilityManagementIntegrationExtension.prototype.onToolbarCreated = function () {
    // Create a new toolbar group if it doesn't exist
    this._group = this.viewer.toolbar.getControl('FacilityManagementIntegrationExtensionToolbar');
    if (!this._group) {
        this._group = new Autodesk.Viewing.UI.ControlGroup('FacilityManagementIntegrationExtensionToolbar');
        this.viewer.toolbar.addControl(this._group);
    }

    // Add a new button to the toolbar group
    this._button = new Autodesk.Viewing.UI.Button('FacilityManagementIntegration');
    this._button.onClick = (ev) => {

        if (!this._panel) {

            var template = document.querySelector('#fm-integration-panel-content');

            var clone = document.importNode(template.content, true);

            this._panel = new FMIntegrationPanel(this.viewer, this.viewer.container, 'fm-db-integration-panel', 'FM DB 連携', clone, 10, 10);

        }

        // Show/hide docking panel
        this._panel.setVisible(!this._panel.isVisible());

    };
    this._button.setToolTip('Forge Viewer DA4R Extension');
    this._button.addClass('facility-management-integration-panel-style');
    this._group.addControl(this._button);
}

Autodesk.Viewing.theExtensionManager.registerExtension('FacilityManagementIntegrationExtension', FacilityManagementIntegrationExtension);

FMIntegrationPanel = function (viewer, parentContainer, id, title, content, x, y) {
    this.content = content;
    this.viewer = viewer;
    Autodesk.Viewing.UI.DockingPanel.call(this, parentContainer, id, title);

    // Auto-fit to the content and don't allow resize.  Position at the coordinates given.
    //
    this.container.style.height = "220px";
    this.container.style.width = "300px";
    this.container.style.minHeight = "220px";
    this.container.style.minWidth = "300px";
    this.container.style.resize = "none";
    this.container.style.left = x + "px";
    this.container.style.top = y + "px";
};

FMIntegrationPanel.prototype = Object.create(Autodesk.Viewing.UI.DockingPanel.prototype);
FMIntegrationPanel.prototype.constructor = FMIntegrationPanel;
var $upsertButton = {};
var $importButton = {};

FMIntegrationPanel.prototype.initialize = function () {
    // Override DockingPanel initialize() to:
    // - create a standard title bar
    // - click anywhere on the panel to move
    // - create a close element at the bottom right
    //
    this.title = this.createTitleBar(this.titleLabel || this.container.id);
    this.container.appendChild(this.title);
    this.container.appendChild(this.content);
    var childrenNode = {};

    var viewer = this.viewer;

    $(document).on('click', '#fm-db-integration-panel button.btn-upsert-fmdb', function () {

        var isolatedNode = viewer.impl.visibilityManager.getIsolatedNodes(viewer.impl.model);

        if (isolatedNode.length > 0) {

            $upsertButton = $('#fm-db-integration-panel button.btn-upsert-fmdb').button('loading');

            startConnection(function () {

                getChildLeafComponents(viewer, isolatedNode[0], function (dbIds) {

                    var promises = [];

                    for (var i = 0; i < dbIds.length; i++) {

                        var dbIdData = {};
                        dbIdData.Index = i;
                        dbIdData.Id = dbIds[i];

                        promises.push(getPropertiesAsync(dbIdData));

                    };

                    Promise.all(promises)
                        .then(function (assets) {

                            console.log(assets);

                            var formData = new FormData();
                            formData.append('data', JSON.stringify({
                                assets: assets,
                                browerConnectionId: connectionId
                            }));

                            console.log(assets);

                            $.ajax({
                                url: 'api/forge/revit_fm/upsert_assets',
                                data: formData,
                                processData: false,
                                contentType: false,
                                type: 'POST',
                                success: function (res) {
                                    console.log('Upserting assets started');
                                    $upsertButton.button('reset');
                                }
                            });
                        });
                })

                function getPropertiesAsync(dbIdData) {

                    return new Promise(function (resolve, reject) {

                        viewer.getProperties(dbIdData.Id, function (result) {

                            var objectProp = result;

                            var urn = viewer.impl.model.myData.urn;

                            var asset = {};

                            asset.id = "AU_" + dbIdData.Index;
                            asset.model_id = $('#user-hubs').find('li[id^="' + urn + '"]').parent().parent().attr('id');
                            asset.name = objectProp.name;
                            asset.revit_guid = objectProp.externalId;

                            for (var i = 0; i < objectProp.properties.length; i++) {

                                var familyProp = objectProp.properties[i];

                                switch (familyProp.displayName) {
                                    case "Category":
                                        asset.category = familyProp.displayValue;
                                        break;
                                    case "対象室":
                                        asset.location = familyProp.displayValue;
                                        break;
                                    case "タイプ名":
                                        asset.type_name = familyProp.displayValue;
                                        break;
                                }
                            };

                            resolve(asset);

                        }, function (error) {

                            reject(error);
                        })
                    })
                };

            });

        }
        else {

            alert("モデルブラウザで対象の要素を選択してください。（例：機械設備->1103_FAN_消音ボックス付送風機）");

        }

    });

    $(document).on('click', '#fm-db-integration-panel .btn-import-fmdb', function () {

        var itemUrlStr = $('#user-hubs').find('li[id^="' + viewer.impl.model.myData.urn + '"]').attr('id');
        var folderUrlStr = $('#user-hubs').find('li[id^="' + viewer.impl.model.myData.urn + '"]').parent().parent().parent().parent().attr('id');
        var targetId = $('#user-hubs').find('li[id^="' + viewer.impl.model.myData.urn + '"]').parent().parent().attr('id');
        var fileNameStr = $('#user-hubs').find('a[id="' + targetId + '_anchor"]').text();

        var isolatedNode = viewer.impl.visibilityManager.getIsolatedNodes(viewer.impl.model);

        if (isolatedNode.length > 0) {

            $importButton = $('#fm-db-integration-panel button.btn-import-fmdb').button('loading');

            startConnection(function () {

                getChildLeafComponents(viewer, isolatedNode[0], function (dbIds) {

                    var promises = [];

                    for (var i = 0; i < dbIds.length; i++) {

                        var dbIdData = {};
                        dbIdData.Index = i;
                        dbIdData.Id = dbIds[i];

                        promises.push(getPropertiesAsync(dbIdData));

                    };

                    Promise.all(promises)
                        .then(function (assets) {

                            console.log(assets);

                            var formData = new FormData();
                            formData.append('data', JSON.stringify({
                                assets: assets,
                                inputRvtFileUrl: itemUrlStr,
                                inputRvtFileName: fileNameStr,
                                outputFileUrl: itemUrlStr,
                                outputFileName: fileNameStr,
                                outputFolderUrl: folderUrlStr,
                                activityName: "FMAssetsToRevitActivity+test",
                                browerConnectionId: connectionId
                            }));

                            console.log(assets);

                            $.ajax({
                                url: 'api/forge/fm_revit/sync_assets',
                                data: formData,
                                processData: false,
                                contentType: false,
                                type: 'Post',
                                success: function (res) {
                                    console.log('Workitem started: ' + res.workItemId);
                                }
                            });
                        });
                })

                function getPropertiesAsync(dbIdData) {

                    return new Promise(function (resolve, reject) {

                        viewer.getProperties(dbIdData.Id, function (result) {

                            var objectProp = result;

                            var urn = viewer.impl.model.myData.urn;

                            var asset = {};

                            asset.model_id = $('#user-hubs').find('li[id^="' + urn + '"]').parent().parent().attr('id');
                            asset.name = objectProp.name;
                            asset.revit_guid = objectProp.externalId;

                            resolve(asset);

                        }, function (error) {

                            reject(error);
                        })
                    })
                };
            });
        }
        else {

            alert("モデルブラウザで対象の要素を選択してください。（例：機械設備->1103_FAN_消音ボックス付送風機）");

        }
        
    });

    this.initializeMoveHandlers(this.container);

    this.closer = this.getDocument().querySelector("#fm-db-integration-panel .docking-panel-close");
    this.initializeCloseHandler(this.closer);
    this.container.appendChild(this.closer);
};

    function getChildLeafComponents(viewer,dbId, callback) {
        var cbCount = 0; // count pending callbacks
        var components = []; // store the results
        var tree; // the instance tree

        function getLeafComponentsRec(parent) {
            cbCount++;
            if (tree.getChildCount(parent) != 0) {
                tree.enumNodeChildren(parent, function (children) {
                    getLeafComponentsRec(children);
                }, false);
            } else {
                components.push(parent);
            }
            if (--cbCount == 0) callback(components);
        }
        viewer.getObjectTree(function (objectTree) {
            tree = objectTree;
            var allLeafComponents = getLeafComponentsRec(dbId);
        });
    }

