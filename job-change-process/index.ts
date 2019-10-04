import { AzureFunction, Context } from "@azure/functions"
import { createLogObject } from "../SharedCode/createLogObject";
import { createLogBlob } from "../SharedCode/createLogBlob";
import { createCallbackMessage } from "../SharedCode/createCallbackMessage";
import { createEvent } from "../SharedCode/createEvent";

const jobChangeProcess: AzureFunction = async function (context: Context, triggerMessage: any): Promise<void> {
    const functionInvocationID = context.executionContext.invocationId;
    const functionInvocationTime = new Date();
    const functionInvocationTimestamp = functionInvocationTime.toJSON();  // format: 2012-04-23T18:25:43.511Z

    const functionName = context.executionContext.functionName;
    const functionEventType = 'WRDSB.Flenderson.Job.Change.Process';
    const functionEventID = `flenderson-functions-${functionName}-${functionInvocationID}`;
    const functionLogID = `${functionInvocationTime.getTime()}-${functionInvocationID}`;

    const logStorageAccount = process.env['storageAccount'];
    const logStorageKey = process.env['storageKey'];
    const logStorageContainer = 'function-job-change-process-logs';

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

            events = events.concat(craftJobCreateEvent(oldRecord, newRecord));

            break;
        case 'delete':
            oldRecord = payload;
            newRecord = {};

            events = events.concat(craftJobDeleteEvent(oldRecord, newRecord));

            break;
        case 'update':
            oldRecord = payload.previous;
            newRecord = payload.now;

            events = events.concat(craftJobUpdateEvent(oldRecord, newRecord));

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

    function craftJobCreateEvent(old_record, new_record)
    {
        let event_type = 'Flenderson.Job.Create';
        let source = 'create';
        let schema = 'create';
        let label = `Job ${new_record.id} created.`;
        let payload = {
            record: new_record
        };

        let events = [craftEvent(new_record.id, source, schema, event_type, label, payload)];
        return events;
    }
    
    function craftJobUpdateEvent(old_record, new_record)
    {
        let event_type = 'Flenderson.Job.Update';
        let source = 'update';
        let schema = 'update';
        let label = `Job ${new_record.id} updated.`;
        let payload = {
            old_record: old_record,
            new_record: new_record,
        };

        let events = [craftEvent(new_record.id, source, schema, event_type, label, payload)];
        return events;
    }

    function craftJobDeleteEvent(old_record, new_record)
    {
        let event_type = 'Flenderson.Job.Delete';
        let source = 'delete';
        let schema = 'delete';
        let label = `Job ${new_record.id} deleted.`;
        let payload = {
            record: old_record
        };

        let events = [craftEvent(old_record.id, source, schema, event_type, label, payload)];
        return events;
    }

    function craftEvent(recordID, source, schema, event_type, label, payload) {
        let event = {
            id: `${event_type}-${context.executionContext.invocationId}`,
            time: functionInvocationTimestamp,

            type: event_type,
            source: `/flenderson/job/${recordID}/${source}`,
            schemaURL: `ca.wrdsb.flenderson.job.${schema}.json`,

            label: label,
            tags: [
                "flenderson", 
                "hris_job_change",
                "job_change"
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

export default jobChangeProcess;
