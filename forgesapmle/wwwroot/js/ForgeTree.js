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

$(document).ready(function () {
    // first, check if current visitor is signed in
    jQuery.ajax({
        url: '/api/forge/oauth/token',
        success: function (res) {
            // yes, it is signed in...
            $('#signOut').show();
            $('#refreshHubs').show();

            // prepare sign out
            $('#signOut').click(function () {
                $('#hiddenFrame').on('load', function (event) {
                    location.href = '/api/forge/oauth/signout';
                });
                $('#hiddenFrame').attr('src', 'https://accounts.autodesk.com/Authentication/LogOut');
                // learn more about this signout iframe at
                // https://forge.autodesk.com/blog/log-out-forge
            })

            // and refresh button
            $('#refreshHubs').click(function () {
                $('#user-hubs').jstree(true).refresh();
            });

            // finally:
            prepareUserHubsTree();
            showUser();
            
        },
        error: function (res) {

            console.log(res);
        }
    });

    $('.drawer').drawer({
        class: {
            nav: 'drawer-nav',
            toggle: 'drawer-toggle',
            overlay: 'drawer-overlay',
            open: 'drawer-open',
            close: 'drawer-close',
            dropdown: 'drawer-dropdown'
        },
        iscroll: {
            // Configuring the iScroll
            // https://github.com/cubiq/iscroll#configuring-the-iscroll
            mouseWheel: true,
            preventDefault: false
        },
        showOverlay: true
    });

    $('#autodeskSigninButton').click(function () {
        jQuery.ajax({
            url: '/api/forge/oauth/url',
            success: function (url) {
                location.href = url;
            }
        });
    });

    $('#replace-family-form-row').hide();
});

function prepareUserHubsTree() {
    $('#user-hubs').jstree({
        'core': {
            'themes': { "icons": true },
            'multiple': false,
            'data': {
                "url": '/api/forge/datamanagement',
                "dataType": "json",
                'cache': false,
                'data': function (node) {
                    $('#user-hubs').jstree(true).toggle_node(node);
                    return { "id": node.id };
                }
            }
        },
        'types': {
            'default': { 'icon': 'glyphicon glyphicon-question-sign' },
            '#': { 'icon': 'glyphicon glyphicon-user' },
            'hubs': { 'icon': 'https://github.com/Autodesk-Forge/bim360appstore-data.management-nodejs-transfer.storage/raw/master/www/img/a360hub.png' },
            'personalHub': { 'icon': 'https://github.com/Autodesk-Forge/bim360appstore-data.management-nodejs-transfer.storage/raw/master/www/img/a360hub.png' },
            'bim360Hubs': { 'icon': 'https://github.com/Autodesk-Forge/bim360appstore-data.management-nodejs-transfer.storage/raw/master/www/img/bim360hub.png' },
            'accHubs': { 'icon': '../css/ACC_hub.svg' },
            'bim360projects': { 'icon': 'https://github.com/Autodesk-Forge/bim360appstore-data.management-nodejs-transfer.storage/raw/master/www/img/bim360project.png' },
            'a360projects': { 'icon': 'https://github.com/Autodesk-Forge/bim360appstore-data.management-nodejs-transfer.storage/raw/master/www/img/a360project.png' },
            'accprojects': { 'icon': '../css/ACC_project.svg' },
            'folders': { 'icon': 'glyphicon glyphicon-folder-open' },
            'items': { 'icon': 'glyphicon glyphicon-file' },
            'bim360documents': { 'icon': 'glyphicon glyphicon-file' },
            'versions': { 'icon': 'glyphicon glyphicon-time' },
            'unsupported': { 'icon': 'glyphicon glyphicon-ban-circle' }
        },
        "sort": function (a, b) {
            var a1 = this.get_node(a);
            var b1 = this.get_node(b);
            var parent = this.get_node(a1.parent);
            if (parent.type === 'items') { // sort by version number
                var id1 = Number.parseInt(a1.text.substring(a1.text.indexOf('v') + 1, a1.text.indexOf(':')))
                var id2 = Number.parseInt(b1.text.substring(b1.text.indexOf('v') + 1, b1.text.indexOf(':')));
                return id1 > id2 ? 1 : -1;
            }
            else if (a1.type !== b1.type) return a1.icon < b1.icon ? 1 : -1; // types are different inside folder, so sort by icon (files/folders)
            else return a1.text > b1.text ? 1 : -1; // basic name/text sort
        },
        "checkbox": {
            three_state: false, // to avoid that fact that checking a node also check others
            whole_node: false,  // to avoid checking the box just clicking the node
            tie_selection: false // for checking without selecting and selecting without checking
        },
        "plugins": ["types", "state", "sort", "contextmenu", "checkbox", "search"],
        "state": { "key": "autodeskHubs" },
        "contextmenu": { items: autodeskCustomMenu }
    })
        .on("check_node.jstree uncheck_node.jstree", function (e, data) {

            var lenght = data.selected.length;

            if (lenght > 2) {
                $("#user-hubs").jstree("uncheck_node", data.instance.get_node(data.selected[data.selected.length - 1]).id);
                alert("2つ以上は選択できません。");
            }
        })
        .on("changed.jstree", function (e, data) {
            // do nothing
        })
        .on('select_node.jstree', function (e, data) {
            if (data.node.children.length > 0) {
                $('#user-hubs').jstree(true).deselect_node(data.node);
            }
            if (data != null && data.node != null && (data.node.type == 'versions' || data.node.type == 'bim360documents')) {

                if (data.node.state.checked === undefined || data.node.state.checked === false) {
                    $("#user-hubs").jstree("check_node", data.node.id);
                }
                else if (data.node.state.checked === true) {
                    $("#user-hubs").jstree("uncheck_node", data.node.id);
                }
            }
        })
        .on('show_contextmenu.jstree', function (e, data) {

            if (data != null && data.node != null && (data.node.type == 'versions' || data.node.type == 'bim360documents')) {

                if (data.node.state.checked === undefined || data.node.state.checked === false) {
                    $("#user-hubs").jstree("check_node", data.node.id);
                }
            }
        })
        .bind("activate_node.jstree", function (evt, data) {
            
        });
}

function prepareItemVersions() {

    jQuery.ajax({
        url: 'api/forge/datamanagement/itemversions',
        success: function (data) {
            console.log(data);
        }
    });

}

function showUser() {
    jQuery.ajax({
        url: '/api/forge/user/profile',
        success: function (profile) {
            var img = '<img src="' + profile.picture + '" height="30px">';
            $('#userInfo').html(img + profile.name);
        }
    });
}

function autodeskCustomMenu(autodeskNode) {
    var items;

    switch (autodeskNode.type) {
        case "folders":
            items = {
                selectFile: {
                    label: "Select Output Folder",
                    action: function () {
                        var treeNode = $('#user-hubs').jstree(true).get_selected(true)[0];
                        selectOutputFolder(treeNode);
                    },
                    icon: 'glyphicon glyphicon-cloud-download'
                }
            };
            break;
        case "versions":
            items = {
                showFMDBIntegrationViewer: {
                    label: "FM DB 統合",
                    action: function () {

                        var checkedNodes = [];

                        $.each(
                            $('#user-hubs').jstree("get_checked", true), function () {
                                var treeNode = this;
                                checkedNodes.push(treeNode);
                            }
                        );

                        if (checkedNodes.length > 1) {
                            alert("FM DB 統合を開始するには、モデルバージョンを1つ選択してください。")
                        }
                        else {
                            var treeNode = $('#user-hubs').jstree(true).get_selected(true)[0];

                            var urnViables = treeNode.id.split('/')[0];

                            if (urnViables.indexOf('|') > -1) {
                                var urn = urnViables.split('|')[0];
                                var viewableId = urnViables.split('|')[1];
                                launchViewer(urn, viewableId);
                            }
                            else {

                                $('#replace-family-form-row').hide();

                                launchViewer(urnViables);
                            }
                        }
                    },
                    icon: 'glyphicon glyphicon-transfer'
                },
                showAggregatedViewer: {
                    label: "問題の報告・履歴の閲覧",
                    action: function () {

                        var checkedNodes = [];

                        $.each(
                            $('#user-hubs').jstree("get_checked", true), function () {
                                var treeNode = this;
                                checkedNodes.push(treeNode);
                            }
                        );


                        if (checkedNodes.length <= 1) {

                            alert("問題の報告・履歴の閲覧を開始するには、モデルバージョンを2つ選択してください。");

                        }
                        else {
                            $('#replace-family-form-row').hide();

                            launchAggregatedViewer(checkedNodes);
                        }
                    },
                    icon: 'glyphicon glyphicon-pencil'
                },
                showPrepareFamilyViewer: {
                    label: "ファミリを表示用にRVT変換",
                    action: function () {

                        var checkedNodes = [];

                        $.each(
                            $('#user-hubs').jstree("get_checked", true), function () {
                                var treeNode = this;
                                checkedNodes.push(treeNode);
                            }
                        );

                        if (checkedNodes.length > 1) {
                            alert("ファミリを表示用に RVT 変換するには、ファミリバージョンを1つ選択してください。")
                        }
                        else {
                            var treeNode = $('#user-hubs').jstree(true).get_selected(true)[0];

                            var family = {};

                            family.itemUrlStr = $('#user-hubs').find('li[id^="' + treeNode.id + '"]').attr('id');
                            family.folderUrlStr = $('#user-hubs').find('li[id^="' + treeNode.id + '"]').parent().parent().parent().parent().attr('id');
                            family.targetId = $('#user-hubs').find('li[id^="' + treeNode.id + '"]').parent().parent().attr('id');
                            family.fileNameStr = $('#user-hubs').find('a[id="' + family.targetId + '_anchor"]').text();

                            if (family.fileNameStr.indexOf('.rfa') !== -1) {

                                if (confirm('ファミリを Forge Viewer 表示用に RVT 変換します。')) {

                                    prepareFamilyForViewer(family);

                                }
                            }
                            else {

                                alert("ファミリ（RFA ファイル）のバージョンを選択してください。");
                                
                            }
                        }
                    },
                    icon: 'glyphicon glyphicon-export'
                },
                showReplaceFamilyViewer: {
                    label: "ファミリ交換",
                    action: function () {

                        var models = [];

                        $.each(
                            $('#user-hubs').jstree("get_checked", true), function () {
                                var treeNode = this;

                                var model = {};
                                model.urn = treeNode.id.split('/')[0];
                                model.itemUrlStr = $('#user-hubs').find('li[id^="' + treeNode.id + '"]').attr('id');
                                model.folderUrlStr = $('#user-hubs').find('li[id^="' + treeNode.id + '"]').parent().parent().parent().parent().attr('id');
                                model.targetId = $('#user-hubs').find('li[id^="' + treeNode.id + '"]').parent().parent().attr('id');
                                model.fileNameStr = $('#user-hubs').find('a[id="' + model.targetId + '_anchor"]').text();

                                models.push(model);
                            }
                        );

                        if (models.length <= 1) {
                            alert("ファミリ交換を開始するには、RVT ファイルと RFA ファイルを選択してください。");
                        }
                        else {

                            var targetModelUrn;
                            var familyModelUrn;

                            models.forEach(function (model) {

                                if (model.fileNameStr.indexOf('.rvt') !== -1) {

                                    targetModelUrn = model.urn;
                                }
                                else if (model.fileNameStr.indexOf('.rfa') !== -1) {
                                    var familyRvtName = model.fileNameStr.replace('rfa', 'rvt');

                                    var folderDom = $('#user-hubs').find('li[id^="' + model.urn + '"]').parent().parent().parent().parent();

                                    familyModelUrn = $(folderDom).find('ul li a:contains("' + familyRvtName + '")').parent().parent().find('ul li:last').attr('id').split('/')[0];
                                }

                            });

                            if (targetModelUrn != undefined && familyModelUrn != undefined) {

                                $('#replace-family-form-row').show();

                                launchMultipleViewer(familyModelUrn, targetModelUrn);
                            }
                            else {
                                alert("RVT ファイルと RFA ファイルを選択してください。");
                            }

                        }

                    },
                    icon: 'glyphicon glyphicon-wrench'
                },
                showDiffViewer: {
                    label: "変更の確認",
                    action: function () {

                        var checkedNodes = [];

                        $.each(
                            $('#user-hubs').jstree("get_checked", true), function () {
                                var treeNode = this;
                                checkedNodes.push(treeNode);
                            }
                        );

                        if (checkedNodes.length <= 1) {

                            alert("変更の確認を開始するには、モデルバージョンを2つ選択してください。");

                        }
                        else {
                            $('#replace-family-form-row').hide();

                            launchDiffViewer(checkedNodes);
                        }

                    },
                    icon: 'glyphicon glyphicon-eye-open'
                },

            };
            break;
    }

    return items;
}