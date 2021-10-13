var connection;
var connectionId;

$(document).ready(function () {
    startConnection();
});

function startConnection(onReady) {
    if (connection && connection.connectionState) { if (onReady) onReady(); return; }
    connection = new signalR.HubConnectionBuilder().withUrl("/api/signalr/designautomation").build();
    connection.start()
        .then(function () {
            connection.invoke('getConnectionId')
                .then(function (id) {
                    connectionId = id;
                    console.log(connectionId);
                    if (onReady) onReady();
                });
        });

    connection.on("onCompleteFMAssetsToRevit", function (data) {
        var outputData = JSON.parse(data);

        console.log(outputData.reportLog);

        $importButton = $('#fm-db-integration-panel button.btn-import-fmdb').button('loading');
        $importButton.button('reset');


    });

    connection.on("onCompleteReplaceFamily", function (data) {
        var outputData = JSON.parse(data);

        console.log(outputData.reportLog);

        $replaceButton = $('#replace-family-menu #replace-family-button').button('loading');
        $replaceButton.button('reset');

    });

    connection.on("onCompletePrepareFamily", function (data) {
        var outputData = JSON.parse(data);

        console.log(outputData.reportLog);

    });
}