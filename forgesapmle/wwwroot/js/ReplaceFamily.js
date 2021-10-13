$(document).ready(function () {

    $('#replace-family-button').on('click', function () {

        if ($('#selected-family-type').val() && $('#selected-family-instance').val()) {

            startConnection(function () {

                $replaceButton = $('#replace-family-menu #replace-family-button').button('loading');

                var form = $('#replace-family-menu')[0];

                var formData = new FormData();
                formData.append('data', JSON.stringify({
                    selectedFamilyTypeItemUrl: $('#replace-family-menu input:hidden[name="selectedFamilyTypeItemUrl"]').val(),
                    selectedFamilyTypeFolderUrl: $('#replace-family-menu input:hidden[name="selectedFamilyTypeFolderUrl"]').val(),
                    selectedFamilyTypeItemName: $('#replace-family-menu input:hidden[name="selectedFamilyTypeItemName"]').val(),
                    selectedFamilyTypeInstanceGuid: $('#replace-family-menu input:hidden[name="selectedFamilyTypeInstanceGuid"]').val(),
                    selectedFamilyTypeName: $('#replace-family-menu input:hidden[name="selectedFamilyTypeName"]').val(),
                    selectedFamilyTypeCategory: $('#replace-family-menu input:hidden[name="selectedFamilyTypeCategory"]').val(),
                    selectedFamilyInstanceItemUrl: $('#replace-family-menu input:hidden[name="selectedFamilyInstanceItemUrl"]').val(),
                    selectedFamilyInstanceFolderUrl: $('#replace-family-menu input:hidden[name="selectedFamilyInstanceFolderUrl"]').val(),
                    selectedFamilyInstanceItemName: $('#replace-family-menu input:hidden[name="selectedFamilyInstanceItemName"]').val(),
                    selectedFamilyInstanceGuid: $('#replace-family-menu input:hidden[name="selectedFamilyInstanceGuid"]').val(),
                    selectedFamilyInstanceTypeName: $('#replace-family-menu input:hidden[name="selectedFamilyInstanceTypeName"]').val(),
                    selectedFamilyInstanceCategory: $('#replace-family-menu input:hidden[name="selectedFamilyInstanceCategory"]').val(),
                    activityName: "ReplaceFamilyActivity+test",
                    browerConnectionId: connectionId
                }));

                $.ajax({
                    url: 'api/forge/fm_revit/replace_family',
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
        else {

            alert("交換する要素を選択してください。");
        }
    })
});
