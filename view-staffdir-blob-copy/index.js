module.exports = function (context, data) {
    var execution_timestamp = (new Date()).toJSON();  // format: 2012-04-23T18:25:43.511Z

    var inBlob = context.bindings.inBlob;
    context.bindings.outBlob = JSON.stringify(inBlob);

    var event_type = "ca.wrdsb.flenderson.ipps.views.staffdir.blob.copy";
    var event = {
        eventID: `${event_type}-${context.executionContext.invocationId}`,
        eventType: event_type,
        source: "/ipps/view/staffdir/copy",
        schemaURL: "ca.wrdsb.flenderson.ipps.views.staffdir.blob.copy.json",
        extensions: {
            app: 'wrdsb-flenderson',
            label: "flenderson copies ipps_view_staffdir blob",
            tags: [
                "flenderson",
                "ipps",
                "ipps_view",
                "ipps_view_staffdir",
                "copy"
            ]
        },
        data: {
            function_name: context.executionContext.functionName,
            invocation_id: context.executionContext.invocationId,
            result: {
                blobs: [
                    {
                        path: "ipps/view-staffdir-raw.json",
                        connection: "wrdsbflenderson_STORAGE"
                    }
                ]
            },
        },
        eventTime: execution_timestamp,
        eventTypeVersion: "0.1",
        cloudEventsVersion: "0.1",
        contentType: "application/json"
    };

    context.bindings.flynnGrid = event;
    context.res = {
        status: 200,
        body: event
    };
    context.done();
};
