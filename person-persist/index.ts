import { AzureFunction, Context } from "@azure/functions"

const personPersist: AzureFunction = async function (context: Context, triggerMessage: any): Promise<void> {
    const invocationID = context.executionContext.invocationId;
    const invocationTime = new Date();
    const invocationTimestamp = invocationTime.toJSON();  // format: 2012-04-23T18:25:43.511Z

    const appName = 'wrdsb-flenderson';
    const functionName = context.executionContext.functionName;

    const eventID = `flenderson-functions-${functionName}-${invocationID}`;
    const logID = `${invocationTime.getTime()}-${invocationID}`;

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

    let logObject = await createLogObject(logID, invocationTimestamp, oldRecord, newRecord);
    let callbackMessage = await createCallback(eventID, eventType, invocationTimestamp, logID);
    let event = await createEvent(eventID, eventType, invocationTimestamp, appName, functionName, invocationID, logID);

    context.bindings.recordOut = newRecord;
    context.bindings.logObject = JSON.stringify(logObject);
    context.bindings.callbackMessage = JSON.stringify(callbackMessage);
    context.log(JSON.stringify(callbackMessage));
    context.done(null, callbackMessage);

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
            newRecord.created_at = invocationTimestamp;
            newRecord.updated_at = invocationTimestamp;
        } else {
            newRecord = Object.assign(newRecord, oldRecord);
        }

        // mark the record as deleted
        newRecord.deleted_at = invocationTimestamp;
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
            newRecord.created_at = invocationTimestamp;
        } else {
            // Merge request object into current record
            newRecord = Object.assign(newRecord, oldRecord, payload);
        }
        
        newRecord.updated_at = invocationTimestamp;
    
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
            newRecord.created_at = invocationTimestamp;
        } else {
            newRecord.created_at = oldRecord.created_at;
        }

        newRecord.updated_at = invocationTimestamp;

        // replacing a record implicitly undeletes it
        newRecord.deleted_at = '';
        newRecord.deleted = false;
    
        return newRecord;
    }
    
    function createLogObject(logID, invocationTimestamp, oldRecord, newRecord)
    {
        let logObject = {
            id: logID,
            timestamp: invocationTimestamp,
            oldRecord: oldRecord,
            newRecord: newRecord
        };

        return logObject;
    }

    function createCallback(eventID, eventType, invocationTimestamp, logID)
    {
        let callbackMessage = {
            id: eventID,
            event_type: eventType,
            event_time: invocationTimestamp,
            object: logID
        };

        return callbackMessage;
    }

    function createEvent(eventID, eventType, invocationTimestamp, appName, functionName, invocationID, logID)
    {
        let event = {
            id: eventID,
            eventType: eventType,
            eventTime: invocationTimestamp,
            data: {
                event_type: 'function_invocation',
                app: appName,
                function_name: functionName,
                invocation_id: invocationID,
                data: {
                    object: logID
                },
                timestamp: invocationTimestamp
            },
            dataVersion: '1'
        };

        return event;
    }
};

export default personPersist;
