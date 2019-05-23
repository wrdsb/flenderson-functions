import { AzureFunction, Context } from "@azure/functions"

const personChangeProcess: AzureFunction = async function (context: Context, triggerMessage: any): Promise<void> {
    const invocationID = context.executionContext.invocationId;
    const invocationTime = new Date();
    const invocationTimestamp = invocationTime.toJSON();  // format: 2012-04-23T18:25:43.511Z

    const functionName = context.executionContext.functionName;
    const functionEventType = 'Flenderson.Person.Change.Process';
    const functionEventID = `flenderson-functions-${functionName}-${invocationID}`;
    const functionLogID = `${invocationTime.getTime()}-${invocationID}`;

    const triggerObject = triggerMessage;

    const operation = triggerObject.operation;
    const payload = triggerObject.payload;

    // Object to store changes we find
    let changes = {};

    // Array to store messages being sent to Flynn Grid
    let events = [];

    let oldRecord;
    let newRecord;

    switch (operation) {
        case 'create':
            oldRecord = {};
            newRecord = payload;

            events = events.concat(craftPersonCreateEvent(oldRecord, newRecord));

            break;
        case 'delete':
            oldRecord = payload;
            newRecord = {};

            events = events.concat(craftPersonDeleteEvent(oldRecord, newRecord));

            break;
        case 'update':
            oldRecord = payload.previous;
            newRecord = payload.now;

            events = events.concat(craftPersonUpdateEvent(oldRecord, newRecord));
            events = events.concat(compareFieldValues(oldRecord, newRecord));
            events = events.concat(comparePositions(oldRecord, newRecord));

            break;
        default:
            break;
    }

    let logObject = createLogObject(functionLogID, invocationTimestamp, events);

    context.bindings.logObject = logObject;
    context.done(null, events);

    function craftPersonCreateEvent(old_record, new_record)
    {
        let event_type = 'Flenderson.Person.Create';
        let source = 'create';
        let schema = 'create';
        let payload = {
            record: new_record
        };

        let events = [craftEvent(new_record.id, source, schema, event_type, payload)];
        return events;
    }
    
    function craftPersonUpdateEvent(old_record, new_record)
    {
        let event_type = 'Flenderson.Person.Update';
        let source = 'update';
        let schema = 'update';
        let payload = {
            old_record: old_record,
            new_record: new_record,
        };

        let events = [craftEvent(new_record.id, source, schema, event_type, payload)];
        return events;
    }

    function craftPersonDeleteEvent(old_record, new_record)
    {
        let event_type = 'Flenderson.Person.Delete';
        let source = 'delete';
        let schema = 'delete';
        let payload = {
            record: old_record
        };

        let events = [craftEvent(old_record.id, source, schema, event_type, payload)];
        return events;
    }

    function compareFieldValues(old_record, new_record) {
        let events = [];

        // Get a combined list of fields from old_record and new_record
        let fields = new Set(Object.getOwnPropertyNames(old_record).concat(Object.getOwnPropertyNames(new_record)));

        // Iterate over fields list, comparing old and new values
        fields.forEach(function(field) {
            if (field != 'positions') {
                let old_value = old_record[field];
                let new_value = new_record[field];

                // if we lost a field
                if (old_value !== null && new_value === null) {
                    let event_type = `Flenderson.Person.Field.Delete`;
                    let source = `${field}/delete`;
                    let schema = `${field}.delete`;
                    let payload = {
                        record: new_record,
                        field: field,
                        old_value: old_value
                    };

                    events.push(craftEvent(new_record.id, source, schema, event_type, payload));

                // or if we gained a field
                } else if (old_value === null && new_value !== null) {
                    let event_type = `Flenderson.Person.Field.Create`;
                    let source = `${field}/create`;
                    let schema = `ipps_person_${field}.create`;
                    let payload = {
                        record: new_record,
                        field: field,
                        new_value: new_value
                    };

                    events.push(craftEvent(new_record.id, source, schema, event_type, payload));

                // or if field value changed
                } else if (old_value !== new_value) {
                    let event_type = `Flenderson.Person.Field.Update`;
                    let source = `${field}/update`;
                    let schema = `${field}.update`;
                    let payload = {
                        record: new_record,
                        field: field,
                        old_value: old_value,
                        new_value: new_value
                    };

                    events.push(craftEvent(new_record.id, source, schema, event_type, payload));

                // else nothing changed
                } else {
                }
            }
        });

        return events;
    }

    function comparePositions(old_record, new_record) {
        let events = [];

        let old_positions = old_record.positions;
        let new_positions = new_record.positions;

        let old_position_ids = old_positions.map(a => a.position_id);
        let new_position_ids = new_positions.map(a => a.position_id);

        let position_ids = new Set(old_position_ids.concat(new_position_ids));

        position_ids.forEach(function (position_id) {
            let old_position = old_positions.find(function(element) {
                return element.position_id === position_id;
            });
            
            let new_position = new_positions.find(function(element) {
                return element.position_id === position_id;
            });

            // if the position isn't present in old_positions, it's a brand new position
            if (!old_position) {
                let event_type = 'Flenderson.Person.Position.Create';
                let source = `position/${position_id}/create`;
                let schema = `position.create`;
                let payload = {
                    record: new_record,
                    position: new_position
                };

                events.push(craftEvent(new_record.id, source, schema, event_type, payload));

            // if the position isn't present in new_positions, it got dropped
            } else if (!new_position) {
                let event_type = 'Flenderson.Person.Position.Delete';
                let source = `position/${position_id}/delete`;
                let schema = `position.delete`;
                let payload = {
                    record: new_record,
                    position: old_position
                };

                events.push(craftEvent(new_record.id, source, schema, event_type, payload));

            // else position is present in old and new, and we look for changes
            } else {
                let event_type = 'Flenderson.Person.Position.Update';
                let source = `position/${position_id}/update`;
                let schema = `position.update`;
                let payload = {
                    record: new_record,
                    new_position: new_position,
                    old_position: old_position
                };

                events.push(craftEvent(new_record.id, source, schema, event_type, payload));

                events = events.concat(comparePositionFields(new_record, old_position, new_position));
            }
        });

        return events;
    }

    function comparePositionFields(new_record, old_position, new_position) {
        let events = [];
        let position_fields = new Set(Object.getOwnPropertyNames(old_position).concat(Object.getOwnPropertyNames(new_position)));

        position_fields.forEach(function (field) {
            let old_value = old_position[field];
            let new_value = new_position[field];

            // if the field isn't present in the old position, it's a brand new field
            if (old_value === null && new_value !== null) {
                let event_type = `Flenderson.Person.Position.Field.Create`;
                let source = `position/${new_position.position_id}/${field}/create`;
                let schema = `position.${field}.create`;
                let payload = {
                    record: new_record,
                    position: new_position,
                    field: field,
                    new_value: new_value
                };

                events.push(craftEvent(new_record.id, source, schema, event_type, payload));

            // if the field isn't present in the new position, it got dropped
            } else if (new_value === null && old_value !== null) {
                let event_type = `Flenderson.Person.Position.Field.Delete`;
                let source = `position/${old_position.position_id}/${field}/delete`;
                let schema = `position.${field}.delete`;
                let payload = {
                    record: new_record,
                    position: new_position,
                    field: field,
                    old_value: old_value
                };

                events.push(craftEvent(new_record.id, source, schema, event_type, payload));

            // else the field is present in old and new positions, and we look for changes
            } else if (old_value !== new_value) {
                let event_type = `Flenderson.Person.Position.Field.Update`;
                let source = `position/${old_position.position_id}/${field}/update`;
                let schema = `position.${field}.update`;
                let payload = {
                    record: new_record,
                    position: new_position,
                    field: field,
                    old_value: old_value,
                    new_value: new_value
                };

                events.push(craftEvent(new_record.id, source, schema, event_type, payload));

            // else no change in field value
            } else {
            }
        });

        return events;
    }

    function craftEvent(recordID, source, schema, event_type, payload) {
        let event = {
            id: `${event_type}-${context.executionContext.invocationId}`,
            time: invocationTimestamp,

            type: event_type,
            source: `/flenderson/person/${recordID}/${source}`,
            schemaURL: `ca.wrdsb.flenderson.person.${schema}.json`,

            label: `Flenderson changes HRIS Person`, 
            tags: [
                "flenderson", 
                "hris_person_change",
                "person_change"
            ], 

            data: {
                function_name: context.executionContext.functionName,
                invocation_id: context.executionContext.invocationId,
                result: {
                    payload: payload 
                },
            },

            eventTypeVersion: "0.1",
            specversion: "0.2",
            contentType: "application/json"
        };

        context.log(event);

        // TODO: check message length
        return event;
    }

    function createLogObject(logID, invocationTimestamp, events)
    {
        let logObject = {
            id: logID,
            timestamp: invocationTimestamp,
            events: events
        };

        return logObject;
    }
};

export default personChangeProcess;