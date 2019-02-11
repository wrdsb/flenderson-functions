module.exports = function (context, req) {
    var execution_timestamp = (new Date()).toJSON();  // format: 2012-04-23T18:25:43.511Z

    var people = context.bindings.peopleNowArray;
    var directory = context.bindings.directoryNowObject;

    var materializedObject = {};
    var materializedArray = [];

    people.forEach(function(personRecord) {
        var directoryRecord = directory[personRecord.email];

        var materializedPerson = {
            id:             personRecord.id,
            ein:            personRecord.ein,
            email:          personRecord.email,
            username:       personRecord.username,
            first_name:     personRecord.first_name,
            last_name:      personRecord.last_name,
            name:           `${personRecord.first_name} ${personRecord.last_name}`,
            sortable_name:  `${personRecord.last_name}, ${personRecord.first_name}`,
            positions:      personRecord.positions
        };

        if (directoryRecord) {
            (directoryRecord.directory) ? materializedPerson.directory = directoryRecord.directory : materializedPerson.directory = '';
            (directoryRecord.phone_no) ? materializedPerson.phone = directoryRecord.phone_no : materializedPerson.phone = '';
            (directoryRecord.extension) ? materializedPerson.extension = directoryRecord.extension : materializedPerson.extension = '';
            (directoryRecord.mbxnumber) ? materializedPerson.mbxnumber = directoryRecord.mbxnumber : materializedPerson.mbxnumber = '';
        }

        materializedArray.push(materializedPerson);
        materializedObject[materializedPerson.id] = materializedPerson;
    });

    // Write out our matarialized people to blob storage
    context.bindings.materializedPeopleNowArray = JSON.stringify(materializedArray);
    context.bindings.materializedPeopleNowObject = JSON.stringify(materializedObject);
    
    var event_type = "ca.wrdsb.flenderson.people.materialize";
    var event = {
        eventID: `${event_type}-${context.executionContext.invocationId}`,
        eventType: event_type,
        source: "/flenderson/people/materialize",
        schemaURL: "ca.wrdsb.flenderson.people.materialize.json",
        extensions: {
            app: 'wrdsb-flenderson',
            label: "flenderson materializes people",
            tags: [
                "flenderson",
                "people",
                "materialize"
            ]
        },
        data: {
            function_name: context.executionContext.functionName,
            invocation_id: context.executionContext.invocationId,
            result: {
                blobs: [
                    {
                        path: "flenderson/materialized-people-now-array.json",
                        connection: "wrdsbflenderson_STORAGE"
                    },
                    {
                        path: "flenderson/materialized-people-now-object.json",
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
