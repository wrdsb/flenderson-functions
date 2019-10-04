import { AzureFunction, Context } from "@azure/functions";
import { createLogObject } from "../SharedCode/createLogObject";
import { createLogBlob } from "../SharedCode/createLogBlob";
import { createCallbackMessage } from "../SharedCode/createCallbackMessage";
import { createEvent } from "../SharedCode/createEvent";

const personPersist: AzureFunction = async function (context: Context, triggerMessage: any): Promise<void> {
    const functionInvocationID = context.executionContext.invocationId;
    const functionInvocationTime = new Date();
    const functionInvocationTimestamp = functionInvocationTime.toJSON();  // format: 2012-04-23T18:25:43.511Z

    const functionName = context.executionContext.functionName;
    const functionEventType = 'WRDSB.Flenderson.HRIS.Person.Persist';
    const functionEventID = `flenderson-functions-${functionName}-${functionInvocationID}`;
    const functionLogID = `${functionInvocationTime.getTime()}-${functionInvocationID}`;

    const logStorageAccount = process.env['storageAccount'];
    const logStorageKey = process.env['storageKey'];
    const logStorageContainer = 'function-person-persist-logs';

    const eventLabel = '';
    const eventTags = [
        "flenderson", 
    ];

    const triggerObject = triggerMessage;

    const operation = triggerObject.operation;
    const payload = triggerObject.payload;

    let oldRecord = context.bindings.recordIn;
    let newRecord;
    let eventType;

    switch (operation) {
        case 'delete':
            newRecord = doDelete(oldRecord, payload);
            eventType = 'Flenderson.Person.Delete';
            break;
        case 'patch':
            newRecord = doPatch(oldRecord, payload);
            eventType = 'Flenderson.Person.Patch';
            break;
        case 'replace':
            newRecord = doReplace(oldRecord, payload);
            eventType = 'Flenderson.Person.Replace';
            break;
        default:
            break;
    }

    context.bindings.recordOut = newRecord;

    const logPayload = {
        operation: operation,
        old_record: oldRecord,
        new_record: newRecord
    };
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
        } else {
            newRecord = Object.assign(newRecord, oldRecord);
        }

        // mark the record as deleted
        newRecord.deleted_at = functionInvocationTimestamp;
        newRecord.deleted = true;

        return newRecord;
    }

    function doPatch(oldRecord, payload)
    {
        let newRecord = {
            created_at: '',
            updated_at: '',
            deleted_at: '',
            deleted: false
        };

        if (!oldRecord) {
            newRecord = Object.assign(newRecord, payload);
            newRecord.created_at = functionInvocationTimestamp;
        } else {
            // Merge request object into current record
            newRecord = Object.assign(newRecord, oldRecord, payload);
        }
        
        newRecord.updated_at = functionInvocationTimestamp;
    
        // patching a record implicitly undeletes it
        newRecord.deleted_at = '';
        newRecord.deleted = false;

        return newRecord;
    }
    
    function doReplace(oldRecord, payload)
    {
        let newRecord = {
            created_at: '',
            updated_at: '',
            deleted_at: '',
            deleted: false
        };

        newRecord = Object.assign(newRecord, payload);

        if (!oldRecord) {
            newRecord.created_at = functionInvocationTimestamp;
        } else {
            newRecord.created_at = oldRecord.created_at;
        }

        newRecord.updated_at = functionInvocationTimestamp;

        // replacing a record implicitly undeletes it
        newRecord.deleted_at = '';
        newRecord.deleted = false;
    
        return newRecord;
    }
};

export default personPersist;
