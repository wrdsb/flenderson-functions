module.exports = function (context, req) {
    var execution_timestamp = (new Date()).toJSON();  // format: 2012-04-23T18:25:43.511Z

    var person_id = req.body.ein;

    var people = context.bindings.peopleNowObject;
    var directory = context.bindings.directoryNowObject;
    
    var personRecord = people[person_id];
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
        directory:      directoryRecord.directory,
        phone:          directoryRecord.phone_no,
        extension:      directoryRecord.extension,
        mbxnumber:      directoryRecord.mbxnumber,
        positions:      personRecord.positions
    };

    // Write out our matarialized person to Flenderson Cosmos DB
    context.bindings.materializedPerson = JSON.stringify(materializedPerson);
    
    var event_type = "ca.wrdsb.flenderson.person.materialize";
    var event = {
        eventID: `${event_type}-${context.executionContext.invocationId}`,
        eventType: event_type,
        source: "/ipps/person/materialize",
        schemaURL: "ca.wrdsb.flenderson.person.materialize.json",
        extensions: {
            app: 'wrdsb-flenderson',
            label: "flenderson materializes person",
            tags: [
                "flenderson",
                "person",
                "materialize"
            ]
        },
        data: {
            function_name: context.executionContext.functionName,
            invocation_id: context.executionContext.invocationId,
            result: {
                collections: [
                    {
                        path: "flenderson-people",
                        connection: "wrdsb-flenderson_COSMOSDB"
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
