function prepareFamilyForViewer(family){

    startConnection(function () {

        var formData = new FormData();
        formData.append('data', JSON.stringify({
            selectedFamilyItemUrl: family.itemUrlStr,
            selectedFamilyFolderUrl: family.folderUrlStr,
            selectedFamilyItemName: family.fileNameStr,
            activityName: "PrepareFamilyActivity+test",
            browerConnectionId: connectionId
        }));

        $.ajax({
            url: 'api/forge/fm_revit/prepare_family',
            data: formData,
            processData: false,
            contentType: false,
            type: 'Post',
            success: function (res) {
                console.log('Workitem started: ' + res.workItemId);
            }
        });

    });
}