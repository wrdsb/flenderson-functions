module.exports = function (context, data) {
    var execution_timestamp = (new Date()).toJSON();  // format: 2012-04-23T18:25:43.511Z

    var rows = context.bindings.staffdirRaw;

    var directoryObject = {};
    var directoryArray = [];

    rows.forEach(function(row) {
        // If we're missing an email address, bail
        if (!row.EMAIL_ADDRESS) {
            return;
        }

        // Create the directoryRecord object for the directory collections
        var directoryRecord = {
            id:             row.EMAIL_ADDRESS,
            email:          row.EMAIL_ADDRESS,
            first_name:     row.FIRST_NAME,
            last_name:      row.SURNAME,
            name:           `${row.FIRST_NAME} ${row.SURNAME}`,
            sortable_name:  `${row.SURNAME}, ${row.FIRST_NAME}`,
        };

        // Grab what will become our object identifier
        var email = directoryRecord.email;

        // Upsert directoryRecord into directory collection object
        directoryObject[email] = directoryRecord;
    });

    // Add each record from directoryObject to directoryArray
    Object.getOwnPropertyNames(directoryObject).forEach(function (email) {
        directoryArray.push(directoryObject[email]);
    });

    // Write out arrays and objects to blobs
    context.bindings.directoryNowArray = JSON.stringify(directoryArray);
    context.bindings.directoryNowObject = JSON.stringify(directoryObject);

    var event_type = "ca.wrdsb.flenderson.ipps_view_staffdir.process";
    var event = {
        eventID: `${event_type}-${context.executionContext.invocationId}`,
        eventType: event_type,
        source: "/ipps/view/staffdir/process",
        schemaURL: "ca.wrdsb.flenderson.ipps_view_staffdir.process.json",
        extensions: {
            app: 'wrdsb-flenderson',
            label: "flenderson processes ipps_view_staffdir",
            tags: [
                "flenderson",
                "ipps",
                "ipps_view",
                "ipps_view_staffdir",
                "process"
            ]
        },
        data: {
            function_name: context.executionContext.functionName,
            invocation_id: context.executionContext.invocationId,
            result: {
                blobs: [
                    {
                        path: "ipps/directory-now-array.json",
                        connection: "wrdsbflenderson_STORAGE"
                    },
                    {
                        path: "ipps/directory-now-object.json",
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
