import { AzureFunction, Context } from "@azure/functions";
import { createLogObject } from "../SharedCode/createLogObject";
import { createLogBlob } from "../SharedCode/createLogBlob";
import { createCallbackMessage } from "../SharedCode/createCallbackMessage";
import { createEvent } from "../SharedCode/createEvent";

const locationStore: AzureFunction = async function (context: Context, triggerMessage: any): Promise<void> {
    const functionInvocationID = context.executionContext.invocationId;
    const functionInvocationTime = new Date();
    const functionInvocationTimestamp = functionInvocationTime.toJSON();  // format: 2012-04-23T18:25:43.511Z

    const functionName = context.executionContext.functionName;
    const functionEventType = 'WRDSB.Flenderson.HRIS.Location.Store';
    const functionEventID = `flenderson-functions-${functionName}-${functionInvocationID}`;
    const functionLogID = `${functionInvocationTime.getTime()}-${functionInvocationID}`;

    const logStorageAccount = process.env['storageAccount'];
    const logStorageKey = process.env['storageKey'];
    const logStorageContainer = 'function-location-store-logs';

    const eventLabel = '';
    const eventTags = [
        "flenderson", 
    ];

    const triggerObject = triggerMessage;

    const operation = triggerObject.operation;
    const payload = triggerObject.payload;

    let oldRecord = context.bindings.recordIn;
    let newRecord;
    let result;

    switch (operation) {
        case 'delete':
            result = doDelete(oldRecord, payload);
            break;
        case 'patch':
            result = doPatch(oldRecord, payload);
            break;
        case 'replace':
            result = doReplace(oldRecord, payload);
            break;
        default:
            break;
    }

    context.bindings.recordOut = result.newRecord;
    const logPayload = result.event;

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

    function doDelete(oldRecord, payload)
    {
        let event = {};
        let newRecord = {
            created_at: '',
            updated_at: '',
            deleted_at: '',
            deleted: false
        };

        // check for existing record
        if (!oldRecord) {
            newRecord = Object.assign(newRecord, payload);
            newRecord.created_at = functionInvocationTimestamp;
            newRecord.updated_at = functionInvocationTimestamp;

            // mark the record as deleted
            newRecord.deleted_at = functionInvocationTimestamp;
            newRecord.deleted = true;

            event = craftLocationDeleteEvent(oldRecord, newRecord);

        } else {
            newRecord = Object.assign(newRecord, oldRecord);

            // mark the record as deleted
            newRecord.deleted_at = functionInvocationTimestamp;
            newRecord.deleted = true;

            event = craftLocationDeleteEvent(oldRecord, newRecord);
        }

        return {event: event, newRecord: newRecord};
    }

    function doPatch(oldRecord, payload)
    {
        let event = {};
        let newRecord = {
            created_at: '',
            updated_at: '',
            deleted_at: '',
            deleted: false
        };

        if (!oldRecord) {
            newRecord = Object.assign(newRecord, payload);
            newRecord.created_at = functionInvocationTimestamp;
            newRecord.updated_at = functionInvocationTimestamp;
    
            // patching a record implicitly undeletes it
            newRecord.deleted_at = '';
            newRecord.deleted = false;
    
            event = craftLocationCreateEvent(oldRecord, newRecord);

        } else {
            // Merge request object into current record
            newRecord = Object.assign(newRecord, oldRecord, payload);
            newRecord.updated_at = functionInvocationTimestamp;
    
            // patching a record implicitly undeletes it
            newRecord.deleted_at = '';
            newRecord.deleted = false;

            event = craftLocationUpdateEvent(oldRecord, newRecord);
        }

        return {event: event, newRecord: newRecord};
    }
    
    function doReplace(oldRecord, payload)
    {
        let event = {};
        let newRecord = {
            created_at: '',
            updated_at: '',
            deleted_at: '',
            deleted: false
        };

        newRecord = Object.assign(newRecord, payload);

        if (!oldRecord) {
            newRecord.created_at = functionInvocationTimestamp;
            newRecord.updated_at = functionInvocationTimestamp;

            // replacing a record implicitly undeletes it
            newRecord.deleted_at = '';
            newRecord.deleted = false;
        
            event = craftLocationCreateEvent(oldRecord, newRecord);

        } else {
            newRecord.created_at = oldRecord.created_at;
            newRecord.updated_at = functionInvocationTimestamp;

            // replacing a record implicitly undeletes it
            newRecord.deleted_at = '';
            newRecord.deleted = false;
        
            event = craftLocationUpdateEvent(oldRecord, newRecord);
        }

        return {event: event, newRecord: newRecord};
    }

    function craftLocationCreateEvent(old_record, new_record)
    {
        let event_type = 'Flenderson.Location.Create';
        let source = 'create';
        let schema = 'create';
        let label = `Location ${new_record.id} created.`;
        let payload = {
            record: new_record
        };

        let event = craftEvent(new_record.id, source, schema, event_type, label, payload);
        return event;
    }
    
    function craftLocationUpdateEvent(old_record, new_record)
    {
        let event_type = 'Flenderson.Location.Update';
        let source = 'update';
        let schema = 'update';
        let label = `Location ${new_record.id} updated.`;
        let payload = {
            old_record: old_record,
            new_record: new_record,
        };

        let event = craftEvent(new_record.id, source, schema, event_type, label, payload);
        return event;
    }

    function craftLocationDeleteEvent(old_record, new_record)
    {
        let event_type = 'Flenderson.Location.Delete';
        let source = 'delete';
        let schema = 'delete';
        let label = `Location ${new_record.id} deleted.`;
        let payload = {
            record: old_record
        };

        let event = craftEvent(old_record.id, source, schema, event_type, label, payload);
        return event;
    }

    function craftEvent(recordID, source, schema, event_type, label, payload) {
        let event = {
            id: `${event_type}-${context.executionContext.invocationId}`,
            time: functionInvocationTimestamp,

            type: event_type,
            source: `/flenderson/location/${recordID}/${source}`,
            schemaURL: `ca.wrdsb.flenderson.location.${schema}.json`,

            label: label,
            tags: [
                "flenderson", 
                "hris_location_change",
                "location_change"
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

export default locationStore;
