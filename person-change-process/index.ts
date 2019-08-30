import { AzureFunction, Context } from "@azure/functions"
import { createLogObject } from "../SharedCode/createLogObject";
import { createLogBlob } from "../SharedCode/createLogBlob";
import { createCallbackMessage } from "../SharedCode/createCallbackMessage";
import { createEvent } from "../SharedCode/createEvent";

const personChangeProcess: AzureFunction = async function (context: Context, triggerMessage: any): Promise<void> {
    const functionInvocationID = context.executionContext.invocationId;
    const functionInvocationTime = new Date();
    const functionInvocationTimestamp = functionInvocationTime.toJSON();  // format: 2012-04-23T18:25:43.511Z

    const functionName = context.executionContext.functionName;
    const functionEventType = 'WRDSB.Flenderson.Person.Change.Process';
    const functionEventID = `flenderson-functions-${functionName}-${functionInvocationID}`;
    const functionLogID = `${functionInvocationTime.getTime()}-${functionInvocationID}`;

    const logStorageAccount = process.env['storageAccount'];
    const logStorageKey = process.env['storageKey'];
    const logStorageContainer = 'function-person-change-process-logs';

    const eventLabel = '';
    const eventTags = [
        "flenderson", 
    ];

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

    const logPayload = events;
    const logObject = await createLogObject(functionInvocationID, functionInvocationTime, functionName, logPayload);
    const logBlob = await createLogBlob(logStorageAccount, logStorageKey, logStorageContainer, logObject);
    context.log(logBlob);
    
    const callbackMessage = await createCallbackMessage(logObject, 200);
    context.bindings.callbackMessage = JSON.stringify(callbackMessage);
    context.log(callbackMessage);

    const invocationEvent = await createEvent(functionInvocationID, functionInvocationTime, functionInvocationTimestamp, functionName, functionEventType, functionEventID, functionLogID, logStorageAccount, logStorageContainer, eventLabel, eventTags);
    context.bindings.flynnEvent = JSON.stringify(invocationEvent);
    context.log(invocationEvent);

    context.done(null, logBlob);

    function craftPersonCreateEvent(old_record, new_record)
    {
        let event_type = 'Flenderson.Person.Create';
        let source = 'create';
        let schema = 'create';
        let label = `${new_record.email}'s HRIS record created.`;
        let payload = {
            record: new_record
        };

        let events = [craftEvent(new_record.id, source, schema, event_type, label, payload)];
        return events;
    }
    
    function craftPersonUpdateEvent(old_record, new_record)
    {
        let event_type = 'Flenderson.Person.Update';
        let source = 'update';
        let schema = 'update';
        let label = `${new_record.email}'s HRIS record updated.`;
        let payload = {
            old_record: old_record,
            new_record: new_record,
        };

        let events = [craftEvent(new_record.id, source, schema, event_type, label, payload)];
        return events;
    }

    function craftPersonDeleteEvent(old_record, new_record)
    {
        let event_type = 'Flenderson.Person.Delete';
        let source = 'delete';
        let schema = 'delete';
        let label = `${old_record.email}'s HRIS record deleted.`;
        let payload = {
            record: old_record
        };

        let events = [craftEvent(old_record.id, source, schema, event_type, label, payload)];
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
                    let label = `${new_record.email}'s ${field} deleted (${old_value}).`;
                    let payload = {
                        record: new_record,
                        field: field,
                        old_value: old_value
                    };

                    events.push(craftEvent(new_record.id, source, schema, event_type, label, payload));

                // or if we gained a field
                } else if (old_value === null && new_value !== null) {
                    let event_type = `Flenderson.Person.Field.Create`;
                    let source = `${field}/create`;
                    let schema = `ipps_person_${field}.create`;
                    let label = `${new_record.email}'s ${field} created (${new_value}).`;
                    let payload = {
                        record: new_record,
                        field: field,
                        new_value: new_value
                    };

                    events.push(craftEvent(new_record.id, source, schema, event_type, label, payload));

                // or if field value changed
                } else if (old_value !== new_value) {
                    let event_type = `Flenderson.Person.Field.Update`;
                    let source = `${field}/update`;
                    let schema = `${field}.update`;
                    let label = `${new_record.email}'s ${field} updated from ${old_value} to ${new_value}.`;
                    let payload = {
                        record: new_record,
                        field: field,
                        old_value: old_value,
                        new_value: new_value
                    };

                    events.push(craftEvent(new_record.id, source, schema, event_type, label, payload));

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
                let label = `${new_record.email}'s position ${position_id} created.`;
                let payload = {
                    record: new_record,
                    position: new_position
                };

                events.push(craftEvent(new_record.id, source, schema, event_type, label, payload));

            // if the position isn't present in new_positions, it got dropped
            } else if (!new_position) {
                let event_type = 'Flenderson.Person.Position.Delete';
                let source = `position/${position_id}/delete`;
                let schema = `position.delete`;
                let label = `${new_record.email}'s position ${position_id} deleted.`;
                let payload = {
                    record: new_record,
                    position: old_position
                };

                events.push(craftEvent(new_record.id, source, schema, event_type, label, payload));

            // else position is present in old and new, and we look for changes
            } else {
                let event_type = 'Flenderson.Person.Position.Update';
                let source = `position/${position_id}/update`;
                let schema = `position.update`;
                let label = `${new_record.email}'s position ${position_id} updated.`;
                let payload = {
                    record: new_record,
                    new_position: new_position,
                    old_position: old_position
                };

                events.push(craftEvent(new_record.id, source, schema, event_type, label, payload));

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
                let label = `${new_record.email}'s position ${new_position.position_id} ${field} created (${new_value}).`;
                let payload = {
                    record: new_record,
                    position: new_position,
                    field: field,
                    new_value: new_value
                };

                events.push(craftEvent(new_record.id, source, schema, event_type, label, payload));

            // if the field isn't present in the new position, it got dropped
            } else if (new_value === null && old_value !== null) {
                let event_type = `Flenderson.Person.Position.Field.Delete`;
                let source = `position/${old_position.position_id}/${field}/delete`;
                let schema = `position.${field}.delete`;
                let label = `${new_record.email}'s position ${old_position.position_id} ${field} deleted (was: ${old_value}).`;
                let payload = {
                    record: new_record,
                    position: new_position,
                    field: field,
                    old_value: old_value
                };

                events.push(craftEvent(new_record.id, source, schema, event_type, label, payload));

            // else the field is present in old and new positions, and we look for changes
            } else if (old_value !== new_value) {
                let event_type = `Flenderson.Person.Position.Field.Update`;
                let source = `position/${old_position.position_id}/${field}/update`;
                let schema = `position.${field}.update`;
                let label = `${new_record.email}'s position ${old_position.position_id} ${field} updated from ${old_value} to ${new_value}.`;
                let payload = {
                    record: new_record,
                    position: new_position,
                    field: field,
                    old_value: old_value,
                    new_value: new_value
                };

                events.push(craftEvent(new_record.id, source, schema, event_type, label, payload));

            // else no change in field value
            } else {
            }
        });

        return events;
    }

    function craftEvent(recordID, source, schema, event_type, label, payload) {
        let event = {
            id: `${event_type}-${context.executionContext.invocationId}`,
            time: functionInvocationTimestamp,

            type: event_type,
            source: `/flenderson/person/${recordID}/${source}`,
            schemaURL: `ca.wrdsb.flenderson.person.${schema}.json`,

            label: label,
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

        // TODO: check message length
        return event;
    }
       
};

export default personChangeProcess;
