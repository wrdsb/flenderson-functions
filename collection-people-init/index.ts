import { AzureFunction, Context } from "@azure/functions"

const collectionPeopleInit: AzureFunction = async function (context: Context, triggerMessage: string): Promise<void> {
    const invocationID = context.executionContext.invocationId;
    const functionName = context.executionContext.functionName;
    const invocationTime = new Date();
    const invocationTimestamp = invocationTime.toJSON();  // format: 2012-04-23T18:25:43.511Z

    const eventType = 'Flenderson.Colletion.People.Init';
    const eventID = `flenderson-functions-${functionName}-${invocationID}`;
    const logID = `${invocationTime}-${invocationID}`;

    // give our bindings more human-readable names
    const recordsNow = context.bindings.recordsNow;

    let queueMessages = [];

    // loop through all records in records_now, looking for updates and creates
    Object.getOwnPropertyNames(recordsNow).forEach(function (record_id) {
        let newRecord = recordsNow[record_id];      // get the full person record from records_now

        let queueMessage = {
            operation: 'replace',
            payload: newRecord
        };

        queueMessages.push(JSON.stringify(queueMessage));
    });

    context.bindings.queuePersonPersist = queueMessages;

    async function createLogObject(logID, invocationTimestamp, totalDifferences, calculation)
    {
        let logObject = {
            id: logID,
            timestamp: invocationTimestamp,
            total_differences: totalDifferences,
            differences: {
                created_records: calculation.differences.created_records,
                updated_records: calculation.differences.updated_records,
                deleted_records: calculation.differences.deleted_records
            }
        };

        return logObject;
    }

    async function createCallback(eventID, eventType, invocationTimestamp)
    {
        let callbackMessage = {
            id: eventID,
            event_type: eventType,
            event_time: invocationTimestamp
        };

        return callbackMessage;
    }

    async function createEvent()
    {
        context.log('createEvent');

        let event = {
            id: 'flenderson-functions-' + context.executionContext.functionName +'-'+ context.executionContext.invocationId,
            eventType: 'Flenderson.HRIS.People.Differences.Calculate',
            eventTime: invocationTimestamp,
            data: {
                event_type: 'function_invocation',
                app: 'wrdsb-flenderson',
                function_name: context.executionContext.functionName,
                invocation_id: context.executionContext.invocationId,
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

export default collectionPeopleInit;
