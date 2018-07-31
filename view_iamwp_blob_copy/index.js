module.exports = function (context, data) {
    var execution_timestamp = (new Date()).toJSON();  // format: 2012-04-23T18:25:43.511Z

    // Read in our source blob
    var inBlob = context.bindings.inBlob;

    // Write out our destination blob
    context.bindings.outBlob = inBlob;

    var event_type = "ca.wrdsb.flenderson.ipps.views.iamwp.blob.copy";
    var event = {
        eventID: `${event_type}-${context.executionContext.invocationId}`,
        eventType: event_type,
        source: "/ipps/view/iamwp/copy",
        schemaURL: "ca.wrdsb.flenderson.ipps.views.iamwp.blob.copy.json",
        extensions: {
            app: 'wrdsb-flenderson',
            label: "flenderson copies ipps_view_iamwp blob",
            tags: [
                "flenderson",
                "ipps",
                "ipps_view",
                "ipps_view_iamwp",
                "copy"
            ]
        },
        data: {
            function_name: context.executionContext.functionName,
            invocation_id: context.executionContext.invocationId,
            result: {
                blobs: [
                    {
                        path: "ipps/view-iamwp-raw.json",
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
